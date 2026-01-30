import { useState } from "react";
import { View } from "react-native";
import { Theme } from "../../../constants/theme";
import ForgotPassword from "./forgot_password";
import LoginPage from "./login_page";

export default function AuthIndex() {
  const [currentView, setCurrentView] = useState<"login" | "forgot-password">(
    "login"
  );

  return (
    <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
      {currentView === "login" ? (
        <LoginPage onForgotPassword={() => setCurrentView("forgot-password")} />
      ) : (
        <ForgotPassword onBackToLogin={() => setCurrentView("login")} />
      )}
    </View>
  );
}
