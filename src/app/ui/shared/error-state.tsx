export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid h-full place-items-center px-8 text-center">
      <div>
        <p className="font-semibold text-[#9e352e]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-xl border border-[#d8dfd9] bg-white px-4 py-2 text-sm font-semibold text-[#465249] hover:bg-[#f5f7f5]"
        >
          ลองอีกครั้ง
        </button>
      </div>
    </div>
  );
}
