import type { SupabaseClient } from "@supabase/supabase-js";

/** Claiming in the DB checks all references and prevents new ones before remove.
 * Cleanup failures never change the result of the record mutation.
 */
export async function cleanupUncommittedActivityPhoto(
  supabase: SupabaseClient,
  userId: string,
  photoPath: string | null,
) {
  if (!photoPath || photoPath.split("/")[0] !== userId || photoPath.includes("..")) return;
  try {
    const { data: claimed, error } = await supabase.rpc("claim_activity_photo_cleanup", { p_path: photoPath });
    if (error || claimed !== true) return;
    const { error: removeError } = await supabase.storage.from("activity-photos").remove([photoPath]);
    if (removeError) console.warn("Activity photo cleanup could not complete.");
  } catch {
    console.warn("Activity photo cleanup could not complete.");
  }
}
