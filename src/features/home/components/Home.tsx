import { useGetHomeStatusQuery } from '@/features/home/api/homeApi';

export const Home = () => {
  const { data, isLoading, isError } = useGetHomeStatusQuery();

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-slate-900">Home</h2>
      <p className="text-sm text-slate-700">
        RTK Query example request status:
      </p>
      {isLoading && <p className="text-sm text-slate-600">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Request failed</p>}
      {data && (
        <pre className="rounded bg-slate-100 p-3 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </section>
  );
};
