-- Fix RLS policies for Education Tables
-- Enable INSERT, UPDATE, DELETE for authenticated users (Admin Panel usage)

-- Categories
create policy "Allow authenticated users to insert categories"
    on public.education_categories for insert
    to authenticated
    with check (true);

create policy "Allow authenticated users to update categories"
    on public.education_categories for update
    to authenticated
    using (true)
    with check (true);

create policy "Allow authenticated users to delete categories"
    on public.education_categories for delete
    to authenticated
    using (true);

-- Questions
create policy "Allow authenticated users to insert questions"
    on public.education_questions for insert
    to authenticated
    with check (true);

create policy "Allow authenticated users to update questions"
    on public.education_questions for update
    to authenticated
    using (true)
    with check (true);

create policy "Allow authenticated users to delete questions"
    on public.education_questions for delete
    to authenticated
    using (true);

-- Facts
create policy "Allow authenticated users to insert facts"
    on public.education_facts for insert
    to authenticated
    with check (true);

create policy "Allow authenticated users to update facts"
    on public.education_facts for update
    to authenticated
    using (true)
    with check (true);

create policy "Allow authenticated users to delete facts"
    on public.education_facts for delete
    to authenticated
    using (true);
