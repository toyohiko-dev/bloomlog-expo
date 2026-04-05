export type LoginFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialLoginFormState: LoginFormState = {
  status: "idle",
  message: "",
};
