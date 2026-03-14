import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import MapPage from "./pages/MapPage";
import MyDiary from "./pages/MyDiary";
import CreateDishEntry from "./pages/CreateDishEntry";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />


      {/* Pages with Nav and Protected Routing */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>

        {/* Pages go here */}
        <Route index element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/diary" element={<MyDiary />} />
        <Route path="/diary/new" element={<CreateDishEntry />} />
      </Route>

    </Routes>
  );
}