/* eslint-disable @typescript-eslint/no-explicit-any */
import moduleFactory, { WebPModule } from 'webp-encoder-wasm';
import { replaceWithSafeEvalAndFetchBase64 } from './replace-with-safe-eval-and-fetch-base64';
import SvgWasm from 'svg-wasm';
import { Picture } from '../picture';
import { arrayBufferToBase64 } from './arraybuffer-to-base64';
import { getViewBoxDimensions } from './get-viewbox-dimensions';
import { loadExifMetadata } from 'exif-curator';

let webpModule: WebPModule;

export class SvgConverter {
  private static async preprocessing(svg: string, picture: Picture) {
    if (!SvgWasm.initialized) await SvgWasm.initialize(fetch('/svg_wasm_bg.wasm'));
    if (!webpModule) webpModule = await moduleFactory({ locateFile: () => 'https://unpkg.com/webp-encoder-wasm/webp_enc.wasm' });

    const dataUrl = await picture.loadDataUrl();
    const image = new Image();
    image.src = dataUrl;
    await new Promise((resolve) => (image.onload = resolve));

    const exifMetadata = await loadExifMetadata(dataUrl);
    console.log(exifMetadata);

    // Replace only inside template placeholders: ${ ... }
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const replaceInsidePlaceholders = (input: string, repls: Record<string, string>) => {
      const regex = /\$\{([^}]*)\}/g;
      let m: RegExpExecArray | null;
      const matches: { index: number; full: string; inner: string; replacedInner: string; replaceWhole?: boolean }[] = [];
      while ((m = regex.exec(input)) !== null) {
        const full = m[0];
        const inner = m[1];
        let replacedInner = inner;
        let replaceWhole = false;

        // If the inner is exactly a single token, remember that for IMAGE_DATA we should replace the whole placeholder.
        const singleToken = inner.trim();

        for (const [key, value] of Object.entries(repls)) {
          const re = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'g');
          replacedInner = replacedInner.replace(re, value);
        }

        if (singleToken in repls) {
          // For IMAGE_DATA, replacing the whole placeholder avoids the evaluator attempting a fetch.
          if (singleToken === 'IMAGE_DATA') {
            replaceWhole = true;
            replacedInner = repls[singleToken];
          }
        }

        matches.push({ index: m.index, full, inner, replacedInner, replaceWhole });
      }

      // Reconstruct string from the end to avoid shifting indices
      let out = input;
      for (let i = matches.length - 1; i >= 0; i--) {
        const { index, full, replacedInner, replaceWhole } = matches[i];
        const replacement = replaceWhole ? replacedInner : `\${${replacedInner}}`;
        out = out.slice(0, index) + replacement + out.slice(index + full.length);
      }
      return out;
    };

    const replacements: Record<string, string> = {
      IMAGE_WIDTH: image.width.toString(),
      IMAGE_HEIGHT: image.height.toString(),
      IMAGE_DATA: 'data:image/jpeg;base64,' + arrayBufferToBase64(await fetch(dataUrl).then((res) => res.arrayBuffer())),
      MAKE: exifMetadata?.Make?.description || '',
      MODEL: exifMetadata?.Model?.description || '',
      LENS_MODEL: exifMetadata?.LensModel?.description || '',
      FOCAL_LENGTH: exifMetadata?.FocalLength?.description?.replace(' mm', '') || '',
      FOCAL_LENGTH_35MM: exifMetadata?.FocalLengthIn35mmFilm?.value
        ? `${exifMetadata.FocalLengthIn35mmFilm.value}`
        : `${exifMetadata?.UprightFocalLength35mm?.value}`
        ? exifMetadata.UprightFocalLength35mm.value.toString().includes('.')
          ? exifMetadata.UprightFocalLength35mm.value.toString().split('.').shift() || ''
          : `${exifMetadata.UprightFocalLength35mm.value}`
        : '',
      F_NUMBER: exifMetadata?.FNumber?.description?.substring(0, 5)?.replace('f/', '') || '',
      ISO: exifMetadata?.ISOSpeedRatings?.value ? exifMetadata.ISOSpeedRatings.value.toString() : '',
      EXPOSURE_TIME: exifMetadata?.ExposureTime?.description ? exifMetadata.ExposureTime.description : '',
      DATE_TIME: exifMetadata?.DateTimeOriginal?.description
        ? (() => {
            const [date, time] = exifMetadata.DateTimeOriginal.description.split(' ');
            const yyyymmdd = date.split(':').join('-');
            return `${yyyymmdd} ${time}`;
          })()
        : '',
    };

    const onlyInTpl = replaceInsidePlaceholders(svg, replacements);

    const convertedSvg = await replaceWithSafeEvalAndFetchBase64(onlyInTpl);

    const { width, height } = getViewBoxDimensions(convertedSvg);

    return {
      convertedSvg: convertedSvg.replace(/\$\{\}/g, ''),
      width,
      height,
    };
  }

  static async toJpeg(svg: string, picture: Picture, assetsJson?: string): Promise<Uint8Array> {
    const { convertedSvg, width, height } = await SvgConverter.preprocessing(svg, picture);
    const fonts = await loadFontsFromAssets(assetsJson);
    return SvgWasm.svg2jpeg(convertedSvg, { width, height, fonts });
  }

  static async toWebp(svg: string, picture: Picture, assetsJson?: string): Promise<Uint8Array> {
    const { convertedSvg, width, height } = await SvgConverter.preprocessing(svg, picture);
    const fonts = await loadFontsFromAssets(assetsJson);
    const pixels = await SvgWasm.svg2pixels(convertedSvg, { width, height, fonts });
    return webpModule.encode(pixels as BufferSource, width, height, {
      quality: 90, // 0~100: 인코딩 품질. 값이 높을수록 품질은 좋으나 파일 크기는 커짐.
      target_size: 0, // 목표 파일 크기(바이트 단위). 0이면 목표 크기를 적용하지 않음.
      target_PSNR: 0, // 목표 PSNR(Peak Signal-to-Noise Ratio). 0이면 PSNR 기준을 무시함.
      method: 0, // 0(최속)부터 6(최고 품질)까지: 인코딩 알고리즘의 탐색 깊이와 최적화 정도. 값이 높을수록 느리지만 최적화가 더 잘됨.
      sns_strength: 50, // Spatial Noise Shaping 강도. 값이 높을수록 노이즈 셰이핑을 강하게 적용하여 품질을 개선하지만, 연산량 증가.
      filter_strength: 60, // 디블럭(아티팩트 제거) 필터 강도. 높을수록 강한 필터링을 적용하지만 처리 시간이 늘어남.
      filter_sharpness: 0, // 필터의 날카로움(Edge Preservation) 조절. 값이 높으면 가장자리 보존 효과가 강해짐.
      filter_type: 1, // 사용되는 필터의 타입(예: 0 또는 1). 각각 속도와 품질에 미세한 차이를 줄 수 있음.
      partitions: 0, // 이미지 파티션 분할 정도. 값이 높을수록 이미지가 세분화되어 최적화되지만 속도가 느려질 수 있음.
      segments: 4, // 이미지 세그먼트 수. 각 세그먼트에 대해 서로 다른 압축 파라미터를 적용할 수 있음.
      pass: 1, // 인코딩 최적화를 위한 반복 횟수. 여러 번의 패스는 결과를 개선하지만 인코딩 시간이 늘어남.
      show_compressed: 0, // 인코딩 과정 중 압축 결과를 출력하거나 디버깅 정보를 표시할지 여부.
      preprocessing: 0, // 인코딩 전 이미지에 전처리(예: 노이즈 제거, 스무딩) 필터를 적용할지 여부.
      autofilter: 0, // 필터 강도를 자동으로 조정하는 기능 활성화 여부. 0이면 수동 설정 사용.
      partition_limit: 0, // 파티션 수의 상한 제한. 0이면 제한 없이 기본값 사용.
      alpha_compression: 0, // 알파(투명도) 채널에 대해서도 압축을 적용할지 여부.
      alpha_filtering: 0, // 알파 채널에 대해 디블럭 필터링(또는 유사 필터링)을 적용할지 여부.
      alpha_quality: 100, // 알파 채널 압축 품질 (0~100). 100은 최대 품질을 의미함.
      lossless: 0, // 손실 없는(lossless) 압축 여부. 0이면 손실 압축을 사용.
      exact: 0, // lossless 모드에서 원본과 정확히 일치하도록 압축할지 여부.
      image_hint: 0, // 이미지의 유형(예: 사진, 그림, 텍스트 등)에 대한 힌트를 제공. 0은 기본값.
      emulate_jpeg_size: 0, // 인코딩 시 JPEG와 유사한 파일 크기 특성을 흉내내도록 할지 여부.
      thread_level: 1, // 멀티스레딩 사용 수준. 0이면 단일 스레드, 1 이상의 값은 병렬 처리(단, 환경에 따라 지원 필요).
      low_memory: 1, // 저메모리 모드 활성화 여부. 1이면 메모리 사용량을 줄이기 위한 최적화 적용(속도 저하 가능).
      near_lossless: 100, // near-lossless 압축 정도. 값이 높을수록 원본에 가까운 압축을 수행.
      use_delta_palette: 0, // 델타 팔레트 기능 사용 여부(색상 최적화). 0이면 사용하지 않음.
      use_sharp_yuv: 0, // YUV 변환 시 더 선명하게 처리할지 여부. 0이면 기본 처리 방식 사용.
    })!;
  }
}

async function loadFontsFromAssets(assetsJson?: string): Promise<Uint8Array[]> {
  try {
    if (!assetsJson) return [];
    const parsed = JSON.parse(assetsJson);
    const fontsVal = (parsed as any)?.fonts;
    let urls: string[] = [];
    if (Array.isArray(fontsVal)) {
      // New format: ["https://...", "https://..."]
      if (fontsVal.every((v) => typeof v === 'string')) {
        urls = fontsVal as string[];
      } else {
        // Backward compatibility: [{ url: "..." }]
        urls = (fontsVal as Array<any>).map((it) => (it && typeof it.url === 'string' ? it.url : undefined)).filter((u): u is string => typeof u === 'string' && u.length > 0);
      }
    }
    if (urls.length === 0) return [];
    const bufs: Uint8Array[] = [];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        const ab = await res.arrayBuffer();
        bufs.push(new Uint8Array(ab));
      } catch (e) {
        console.warn('Failed to load font url', url, e);
      }
    }
    return bufs;
  } catch (e) {
    // Ignore parse errors and return empty -> no fonts applied
    return [];
  }
}
