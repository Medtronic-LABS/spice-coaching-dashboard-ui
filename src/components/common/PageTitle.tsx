type PageTitleProps = {
  title: string;
};

export const PageTitle = ({ title }: PageTitleProps) => {
  return <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>;
};
