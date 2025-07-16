import { Route, Routes } from "react-router";
import Home from "./features/home";
import CoursePage from "./features/canvas/CoursePage";
import AssignmentPage from "./features/canvas/assignment/AssignmentPage";
import { SubmissionPage } from "./features/canvas/SubmissionPage";
import { VoicePage } from "./features/voice/VoicePage";
import { AiCharting } from "./features/aiCharting/AiCharting";
import { TermPage } from "./features/canvas/terms/TermPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/term/:termName" element={<TermPage />} />
        <Route path="/course" element={<CoursePage />} />
        <Route path="/assignment/:assignmentId" element={<AssignmentPage />} />
        <Route path="/submission" element={<SubmissionPage />} />
        <Route path="/voice" element={<VoicePage />} />
        <Route path="/chart" element={<AiCharting />} />
      </Routes>
    </>
  );
}

export default App;
