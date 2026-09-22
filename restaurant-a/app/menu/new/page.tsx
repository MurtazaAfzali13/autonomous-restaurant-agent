import MealForm from "../components/MealForm";

export const metadata = {
  title: "Add New Meal",
};

export default function AddMealPage() {
  return (
    <main className="min-h-screen flex justify-center items-start pt-40 bg-gray-900 text-gray-200">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-[90%] max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-teal-400">
          Add New Meal
        </h1>
        <MealForm />
      </div>
    </main>
  );
}
