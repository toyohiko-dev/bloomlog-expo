export type Profile = {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
};

export type ProfileFormState = {
  status: "idle" | "success" | "error";
  message: string;
  displayName: string;
  fieldErrors: {
    displayName?: string;
  };
};

export const initialProfileFormState: ProfileFormState = {
  status: "idle",
  message: "",
  displayName: "",
  fieldErrors: {},
};
