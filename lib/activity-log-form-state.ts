export type ActivityLogFieldErrors = Partial<
  Record<
    | "activityType"
    | "pavilionId"
    | "title"
    | "occurredAt"
    | "memo"
    | "price"
    | "acquisitionMethod"
    | "photo",
    string
  >
>;

export type ActivityLogFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: ActivityLogFieldErrors;
};

export const initialActivityLogFormState: ActivityLogFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};
