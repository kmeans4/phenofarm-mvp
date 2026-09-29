import {
  BusinessDirectory,
  type DirectoryParams,
} from '../components/BusinessDirectory';
export default function Page({
  searchParams,
}: {
  searchParams: DirectoryParams;
}) {
  return (
    <BusinessDirectory
      kind="dispensary"
      title="Dispensaries"
      searchParams={searchParams}
    />
  );
}
