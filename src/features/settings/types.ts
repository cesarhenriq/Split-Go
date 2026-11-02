export type ProfileFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: {
    name?: string;
    email?: string;
  };
};

export const initialProfileFormState: ProfileFormState = {
  status: "idle",
};
