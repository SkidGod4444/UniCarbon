import AdminSideBar from "./components/adminSidebar";


interface AdminProps {
  children?: React.ReactNode;
}

const Admin = ({ children }: AdminProps) => {
  return (
    <div className="flex h-screen w-full">
      <div className="h-full relative">
        <AdminSideBar />
      </div>

      {/* Main Content */}
      <main className=" flex-1 py-8 px-6 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Admin;
