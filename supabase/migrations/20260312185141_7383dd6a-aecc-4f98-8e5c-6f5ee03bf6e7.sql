-- Allow authenticated users to insert their own payment records (for free enrollments)
CREATE POLICY "Users can insert own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);