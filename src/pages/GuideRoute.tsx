import { useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import CompareResources from "@/pages/CompareResources";
import { comparePageFor } from "../../api/_shared/comparePages";

const NotFound = lazy(() => import("@/pages/NotFound"));

/**
 * Any single-segment address that is one of the guide pages (best resources, the channel page, the
 * free-lectures page and so on) shows that guide; anything else is the not-found page. Real pages
 * with their own route are matched first, so this never shadows them.
 */
const GuideRoute = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const path = `/${slug}`;
  if (comparePageFor(path)) return <CompareResources path={path} />;
  return (
    <Suspense fallback={null}>
      <NotFound />
    </Suspense>
  );
};

export default GuideRoute;
