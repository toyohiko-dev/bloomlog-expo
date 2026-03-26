export type SessionFieldErrors = Partial<
  Record<"title" | "visitDate" | "eventId" | "notes", string>
>;

export type SessionFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: SessionFieldErrors;
};

export const initialSessionFormState: SessionFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};
