import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

function Layout({ title, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
      }}
    >
      <Header title={title} />

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "25px",
          paddingBottom: "var(--bottom-navigation-compact-content-offset)",
        }}
      >
        {children}
      </main>

      <BottomNavigation />
    </div>
  );
}

export default Layout;
