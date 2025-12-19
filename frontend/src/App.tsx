import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./Header";
import Home from "./home";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home pageMode="home" />} />
        <Route path="/all" element={<Home pageMode="all" />} />
        <Route path="/my" element={<Home pageMode="my" />} />
        <Route path="/admin" element={<Home pageMode="admin" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
