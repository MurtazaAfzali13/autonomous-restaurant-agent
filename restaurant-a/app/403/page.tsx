export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-red-600">403 - Access Denied</h1>
      <p className="mt-4">You don’t have permission to access this page.</p>
    </div>
  );
}
