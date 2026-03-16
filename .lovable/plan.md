

## Security Audit Results and Fix Plan

### CRITICAL Issues (Must Fix)

**1. Privilege Escalation via `profiles.role` (STILL ACTIVE)**
Even though we added a trigger to block role changes, **4 tables still use `profiles.role` for admin checks**, which means if the trigger fails or is bypassed, students get admin access:
- `study_materials` — "Admins manage content" checks `profiles.role`
- `communities` — "Admins can manage communities" checks `profiles.role`
- `app_routes` — "Admins can manage routes" checks `profiles.role`
- `user_recommendations` — uses `get_my_role()` which reads `profiles.role`

**Fix**: Drop these policies and replace with `is_current_user_admin()`.

**2. Any authenticated user can modify/delete ALL branch notes**
`iitm_branch_notes` has a policy "Authenticated users can modify notes" with `auth.role() = 'authenticated'` on ALL commands. Since permissive policies use OR logic, this **overrides** the admin-only policies — any student can delete/edit all 1,363 notes.

**Fix**: Drop the "Authenticated users can modify notes" policy.

**3. Admin user list exposed to all authenticated users**
`admin_users` has "Allow authenticated users to read admin_users" letting every logged-in user see all admin emails and super_admin flags.

**Fix**: Drop this overly broad SELECT policy. The per-user email-scoped policy already exists.

**4. Unauthenticated users can inject fake audit logs**
`admin_audit_log` has "System can insert audit logs" with `WITH CHECK (true)` on `{public}` role — anyone (even anon) can fabricate audit entries.

**Fix**: Restrict INSERT to `service_role` only.

**5. Any authenticated user can insert notes into public library**
`notes` table has "Authenticated users can insert notes" with `auth.uid() IS NOT NULL` and "Authenticated can insert pyqs" — any student can inject content visible to everyone.

**Fix**: Drop these open INSERT policies. Keep admin-only insert policies.

**6. Same issue on `pyqs` table**
"Authenticated users can insert pyqs" allows any student to add PYQ entries.

**Fix**: Drop this policy.

### WARNING Issues

**7. Two tables have RLS DISABLED entirely**
`country_codes` and `google_group_sync_queue` have no RLS. `country_codes` is read-only public data (acceptable). `google_group_sync_queue` contains email addresses — needs RLS.

**Fix**: Enable RLS on `google_group_sync_queue` with service_role-only access.

**8. Multiple functions missing `search_path` setting**
12 functions don't set `search_path`, making them vulnerable to search_path hijacking.

**Fix**: Add `SET search_path = public` to all affected functions.

**9. Auth settings**
- OTP expiry too long
- Leaked password protection disabled

**Fix**: These are Supabase dashboard settings, not code fixes.

---

### Summary of SQL Migration

| Table | Policy to Drop | Replacement |
|-------|---------------|-------------|
| `study_materials` | "Admins manage content" | New policy using `is_current_user_admin()` |
| `communities` | "Admins can manage communities" | New policy using `is_current_user_admin()` |
| `app_routes` | "Admins can manage routes" | New policy using `is_current_user_admin()` |
| `iitm_branch_notes` | "Authenticated users can modify notes" | Remove (admin policies already exist) |
| `admin_users` | "Allow authenticated users to read admin_users" | Remove (per-user policy exists) |
| `admin_audit_log` | "System can insert audit logs" | Restrict to `service_role` |
| `notes` | "Authenticated users can insert notes" + "Authenticated can insert notes" | Remove both |
| `pyqs` | "Authenticated users can insert pyqs" + "Authenticated can insert pyqs" | Remove both |
| `notes` | "Users can update their own notes" + "Users can delete their own notes" | Remove (students shouldn't edit public library) |
| `pyqs` | "Users can update their own pyqs" + "Users can delete their own pyqs" | Remove (same reason) |
| `google_group_sync_queue` | No RLS | Enable RLS + service_role policy |

Additionally, update `get_my_role()` and functions without `search_path` to use `SET search_path = public`.

### Files Changed
| File | Change |
|------|--------|
| New migration SQL | All policy drops/creates above |

No frontend code changes needed — all fixes are database-level.

