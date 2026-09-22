// components/Layout/MainLayout.tsx

import SideBar from '../SideBar';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="hidden md:block w-64 bg-gray-800 text-white">
        <SideBar />
      </div>
      <div className="flex-1 flex flex-col">
       
        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
