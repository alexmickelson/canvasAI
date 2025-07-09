import { Route, Routes } from "react-router";
import Home from "./features/home";
import CoursePage from "./features/canvas/CoursePage";
import AssignmentPage from "./features/canvas/AssignmentPage";
import { SubmissionPage } from "./features/canvas/SubmissionPage";
import { VoicePage } from "./features/voice/VoicePage";
import { AiCharting } from "./features/aiCharting/AiCharting";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/course" element={<CoursePage />} />
        <Route path="/assignment" element={<AssignmentPage />} />
        <Route path="/submission" element={<SubmissionPage />} />
        <Route path="/voice" element={<VoicePage />} />
        <Route path="/chart" element={<AiCharting />} />
      </Routes>
    </>
  );
}

export default App;
