import {
  BusinessDirectory,
  type DirectoryParams,
} from '../components/BusinessDirectory';
export default function Page({
  searchParams,
}: {
  searchParams: DirectoryParams;
}) {
  return <BusinessDirectory searchParams={searchParams} />;
}
