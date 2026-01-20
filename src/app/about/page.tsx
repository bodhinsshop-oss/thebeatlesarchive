export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">About The Beatles Archive</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">Purpose</h2>
          <p className="text-lg leading-relaxed">
            The Beatles Archive is a comprehensive, collector-style archive dedicated to cataloging
            and preserving information about The Beatles' musical legacy. This archive automatically
            discovers and organizes all Beatles-related works from authoritative music databases,
            providing fans, collectors, and researchers with detailed information about every pressing
            and version of each release.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Work vs. Version Architecture</h2>
          <p className="text-lg leading-relaxed mb-4">
            This archive uses a two-tier structure for maximum collector utility:
          </p>
          <ul className="list-disc list-inside space-y-2 text-lg ml-4">
            <li>
              <strong>Works</strong> — Individual albums, singles, or EPs (e.g., "Abbey Road" or "Let It Be").
              Each work represents a distinct creative release.
            </li>
            <li>
              <strong>Versions</strong> — Different pressings, editions, and releases of each work
              (e.g., original UK pressing, US Capitol release, 2009 remaster, Japanese vinyl, etc.).
              Each version has unique details like country, format, label, catalog number, and barcode.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Data Sources</h2>
          <p className="text-lg leading-relaxed mb-4">
            This archive integrates data from three authoritative sources:
          </p>
          <ul className="list-disc list-inside space-y-2 text-lg ml-4">
            <li>
              <strong>MusicBrainz</strong> — An open music encyclopedia that collects music metadata
              and makes it available to the public. We use MusicBrainz to discover Beatles
              release-groups (works), releases (versions), tracks, and pressing details.
            </li>
            <li>
              <strong>Cover Art Archive</strong> — A joint project between the Internet Archive and
              MusicBrainz that provides album cover images. All cover art displayed on this site is
              sourced from the Cover Art Archive.
            </li>
            <li>
              <strong>Discogs</strong> — The world's largest music database and marketplace. We provide
              links to Discogs for additional release details and marketplace listings where collectors
              can find copies for sale. <em>See External Links Policy below.</em>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">What's Included</h2>
          <p className="text-lg leading-relaxed mb-4">
            The archive includes ALL types of releases:
          </p>
          <ul className="list-disc list-inside space-y-2 text-lg ml-4">
            <li>Studio Albums</li>
            <li>Extended Plays (EPs)</li>
            <li>Compilations</li>
            <li>Live Albums</li>
            <li>Soundtracks</li>
            <li>Singles (all A-sides and B-sides)</li>
            <li>Broadcasts and Radio Shows</li>
            <li>Solo Albums from all four Beatles</li>
          </ul>
          <p className="text-lg leading-relaxed mt-4">
            Each work includes ALL known versions: original pressings, reissues, remasters, international
            releases, promotional copies, and special editions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-lg ml-4">
            <li>Browse and search all Beatles works (1000+ release groups)</li>
            <li>Filter by type (Album, EP, Live, Single, etc.)</li>
            <li>Sort by release year or alphabetically</li>
            <li>View detailed pressing information for each version</li>
            <li>Explore solo careers: John Lennon, Paul McCartney, George Harrison, Ringo Starr</li>
            <li>High-quality album cover artwork</li>
            <li>External links to MusicBrainz and Discogs for additional details</li>
            <li>Direct marketplace links for collectors seeking physical copies</li>
          </ul>
        </section>

        <section className="border-2 border-black p-6 my-8">
          <h2 className="text-2xl font-bold mb-4">External Links Policy</h2>
          <p className="text-lg leading-relaxed mb-4">
            This archive provides links to external services for reference and collector convenience:
          </p>
          <ul className="list-disc list-inside space-y-2 text-lg ml-4">
            <li>
              <strong>MusicBrainz</strong> links allow you to view complete metadata and contribute
              corrections to the open database.
            </li>
            <li>
              <strong>Discogs</strong> links allow you to view additional release details, images,
              and user reviews. Discogs also operates a marketplace where third-party sellers list
              vinyl, CDs, and other physical media for sale.
            </li>
          </ul>
          <p className="text-lg leading-relaxed mt-4 font-semibold">
            Important: Marketplace listings on Discogs are from independent third-party sellers.
            The Beatles Archive is not affiliated with Discogs, does not process any transactions,
            and provides these links solely for informational purposes. All purchases are made
            directly between buyers and sellers on Discogs.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Disclaimer</h2>
          <p className="text-lg leading-relaxed">
            This archive is provided for informational and educational purposes only. While we
            strive for accuracy and completeness, the data is sourced from community-maintained
            databases and may contain occasional errors or omissions. This is a non-commercial
            project with no affiliation to The Beatles, Apple Corps, or any official Beatles entities.
          </p>
        </section>

        <section className="border-t border-neutral-200 dark:border-neutral-800 pt-6 mt-8">
          <p className="text-xl text-center font-semibold">
            The Beatles Archive is a Bodhin Industries creation.
          </p>
        </section>
      </div>
    </div>
  );
}
