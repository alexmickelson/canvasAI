import { VoiceClientDisplay } from "./VoiceClientDisplay";
import { VoiceContextProvider } from "./VoiceContextProvider";

export const VoicePage = () => {
  return (
    <VoiceContextProvider websocketUrl="ws://nixos-vm:8000/asr">
      <div>VoicePage</div>
      <VoiceClientDisplay />
    </VoiceContextProvider>
  );
};
