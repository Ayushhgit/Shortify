import Header from "../components/Header";
import Footer from "../components/Footer";
import { Children } from "react";

const MainLayout = ({ Children }) => {
    return (
        <>
        <Header />
        <main className="min-h-screen">{Children}</main>
        <Footer />
        </>
    );
};

export default MainLayout;