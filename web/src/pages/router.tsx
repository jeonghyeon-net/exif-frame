import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MainPage } from './main/page';
import PrivacyPolicyPage from './privacy-policy/page';
import SponsorsPage from './sponsors/page';
import TermAndConditionsPage from './term-and-conditions/page';
import LoginPage from './login/page';
import RegisterPage from './register/page';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/privacy_policy.html" element={<PrivacyPolicyPage />} />
        <Route path="/term_and_conditions.html" element={<TermAndConditionsPage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
