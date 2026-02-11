import { useState } from "react";
import UploadForm from "./components/UploadForm";
import Feed from "./components/Feed";

function App() {
  const [uploadKey, setUploadKey] = useState(0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>BoWatt Mini Instagram</h1>
        <p>Share images anonymously</p>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <UploadForm onUploaded={() => setUploadKey((k) => k + 1)} />
        </aside>
        <section className="content" key={uploadKey}>
          <Feed />
        </section>
      </main>
    </div>
  );
}

export default App;
