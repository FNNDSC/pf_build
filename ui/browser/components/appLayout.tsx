import React from "react";
import logo from "../../images/ChRISlogo-color.svg";

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => (
    <div className="app-container">
        <header className="app-header">
            <img src={logo} alt="ChRIS Logo" className="app-logo" />
            <h1 className="header-title">ChRIS Plugin Factory</h1>
        </header>
        <main className="app-content">
            <p className="intro-text">
                Welcome to the ChRIS Plugin Factory -- the easiest way to get
                started coding your ChRIS application! Fill in the form and hit
                "Submit".
            </p>
            {children}
        </main>
    </div>
);
