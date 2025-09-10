import { List, Navbar } from 'konsta/react';
import DarkModeListItem from './components/dark-mode.list-item';
import MaintainExifMetadataListItem from './components/maintain-exif-metadata.list-item';
import WebpModeListItem from './components/webp-mode.list-item';
import CurrentVersionListItem from './components/current-version.list-item';
import BugReportListItem from './components/bug-report.list-item';
import RollbackListItem from './components/rollback.list-item';
import GitHubListItem from './components/open-github.list-item';
import SponsorsListItem from './components/sponsors.list-item';
import { useTranslation } from 'react-i18next';
import DiscordListItem from './components/discord-list-item';
import AuthListItem from './components/auth.list-item';

export const SettingTab = () => {
  const { t } = useTranslation();

  return (
    <>
      <Navbar title={t('setting')} />

      <List strongIos inset>
        <AuthListItem />
      </List>

      <List strongIos inset>
        <DarkModeListItem />
        <MaintainExifMetadataListItem />
        <WebpModeListItem />
      </List>

      <List strongIos inset>
        <CurrentVersionListItem />
        <BugReportListItem />
        <GitHubListItem />
        <SponsorsListItem />
        <DiscordListItem />
      </List>

      <List strongIos inset>
        <RollbackListItem />
      </List>
    </>
  );
};
