import { createContext } from "react";

// True once the project modal has finished its open animation.
//
// Anything heavy inside a modal — a video starting to decode, a demo starting
// to animate — waits for this. Kicking them off on the same frames as the
// open transition is what made opening a project stutter: the browser was
// decoding video and laying out media while trying to animate the panel.
//
// Defaults to true so the same components behave normally outside a modal.
export const ModalSettled = createContext(true);
