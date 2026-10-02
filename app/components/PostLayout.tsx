import type { ReactNode } from "react";

type PostLayoutType = {
  heading: string;
  subheading?: string;
  children: ReactNode;
};

export function PostLayout({ heading, subheading, children }: PostLayoutType) {
  return (
    <div className="flex justify-center items-start py-50 h-dvh">
      <div className="md:gap-7 flex-col flex gap-5 items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1>{heading}</h1>
          {subheading && (
            <h6 className="text-muted-foreground">{subheading}</h6>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
