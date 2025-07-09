import { create } from "zustand";

interface ModalState {
    isOpen : boolean;
    selectedDate : string;
    openModal : (date : string) => void;
    closeModal : () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    isOpen : false,
    selectedDate : "",
    openModal : (date : string) => set({isOpen : true, selectedDate : date}),
    closeModal : () => set({isOpen : false, selectedDate : ""}),
}))