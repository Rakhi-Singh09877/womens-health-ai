type ButtonProps = {
  label: string;
  type?: "button" | "submit" | "reset";
};

export default function Button({
  label,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      className="rounded-md bg-pink-600 px-4 py-2 font-medium text-white hover:bg-pink-700"
    >
      {label}
    </button>
  );
}