import NewUserForm from '@/components/NewUserForm';

export default function NewUser() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
        <p className="text-muted-foreground">
          Fill out the form below to create a new user account.
        </p>
      </div>
      <NewUserForm />
    </div>
  );
}
