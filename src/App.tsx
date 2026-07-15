import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CalendarPage from "./pages/CalendarPage";
import DayPage from "./pages/DayPage";
import ResourcesPage from "./pages/ResourcesPage";
import ShoppingPage from "./pages/ShoppingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/day/:n" element={<DayPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
