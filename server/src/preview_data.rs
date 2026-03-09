/*
SPDX-License-Identifier: AGPL-3.0-or-later
SPDX-FileCopyrightText: © 2023-2026 Bruce D'Arcus
*/

//! Preview reference data for the style wizard.
//!
//! Constructs field-specific bibliographies using Rust types directly,
//! eliminating YAML file sync issues. Each field set is designed to
//! stress-test specific formatting features.

use citum_engine::{Bibliography, Reference};
use citum_schema::reference::{
    Contributor, ContributorList, EdtfString, MultilingualString, SimpleName, StructuredName,
    types::{
        Collection, CollectionComponent, CollectionType, Monograph, MonographComponentType,
        MonographType, NumOrStr, Parent, Serial, SerialComponent, SerialComponentType, SerialType,
        Title,
    },
};

// ── factories ──────────────────────────────────────────────────────────

fn empty_monograph(id: &str, r#type: MonographType, title: Title) -> Monograph {
    Monograph {
        id: Some(id.to_string()),
        r#type,
        title,
        author: None,
        editor: None,
        translator: None,
        issued: EdtfString::default(),
        publisher: None,
        url: None,
        accessed: None,
        language: None,
        field_languages: Default::default(),
        note: None,
        isbn: None,
        doi: None,
        edition: None,
        report_number: None,
        collection_number: None,
        genre: None,
        medium: None,
        keywords: None,
        original_date: None,
        original_title: None,
        ads_bibcode: None,
        archive: None,
        archive_location: None,
        container_title: None,
        recipient: None,
        interviewer: None,
    }
}

fn empty_serial(title: Title, r#type: SerialType) -> Serial {
    Serial {
        r#type,
        title,
        short_title: None,
        editor: None,
        publisher: None,
        issn: None,
    }
}

fn empty_serial_component(id: &str, r#type: SerialComponentType, title: Option<Title>, parent: Parent<Serial>) -> SerialComponent {
    SerialComponent {
        id: Some(id.to_string()),
        r#type,
        title,
        author: None,
        translator: None,
        issued: EdtfString::default(),
        parent,
        url: None,
        accessed: None,
        language: None,
        field_languages: Default::default(),
        note: None,
        doi: None,
        pages: None,
        volume: None,
        issue: None,
        genre: None,
        medium: None,
        keywords: None,
        ads_bibcode: None,
    }
}

fn empty_collection(r#type: CollectionType, title: Option<Title>) -> Collection {
    Collection {
        id: None,
        r#type,
        title,
        short_title: None,
        editor: None,
        translator: None,
        issued: EdtfString::default(),
        publisher: None,
        collection_number: None,
        url: None,
        accessed: None,
        language: None,
        field_languages: Default::default(),
        note: None,
        isbn: None,
        keywords: None,
    }
}

fn empty_collection_component(id: &str, r#type: MonographComponentType, title: Option<Title>, parent: Parent<Collection>) -> CollectionComponent {
    CollectionComponent {
        id: Some(id.to_string()),
        r#type,
        title,
        author: None,
        translator: None,
        issued: EdtfString::default(),
        parent,
        pages: None,
        url: None,
        accessed: None,
        language: None,
        field_languages: Default::default(),
        note: None,
        doi: None,
        genre: None,
        medium: None,
        keywords: None,
    }
}

// ── helpers ────────────────────────────────────────────────────────────

fn name(family: &str, given: &str) -> Contributor {
    Contributor::StructuredName(StructuredName {
        family: MultilingualString::Simple(family.to_string()),
        given: MultilingualString::Simple(given.to_string()),
        ..Default::default()
    })
}

fn org(org_name: &str) -> Contributor {
    Contributor::SimpleName(SimpleName {
        name: MultilingualString::Simple(org_name.to_string()),
        location: None,
    })
}

fn names(list: &[(&str, &str)]) -> Contributor {
    Contributor::ContributorList(ContributorList(
        list.iter().map(|(f, g)| name(f, g)).collect(),
    ))
}

fn edtf(s: &str) -> EdtfString {
    EdtfString(s.to_string())
}

fn title(s: &str) -> Title {
    Title::Single(s.to_string())
}

fn book(
    id: &str,
    author: Contributor,
    year: &str,
    book_title: &str,
    publisher: Option<Contributor>,
) -> (String, Reference) {
    let mut monograph = empty_monograph(id, MonographType::Book, title(book_title));
    monograph.author = Some(author);
    monograph.issued = edtf(year);
    monograph.publisher = publisher;
    
    (id.to_string(), Reference::Monograph(Box::new(monograph)))
}

fn article(
    id: &str,
    author: Contributor,
    year: &str,
    art_title: &str,
    journal: &str,
    volume: Option<&str>,
    issue: Option<&str>,
    pages: Option<&str>,
    doi: Option<&str>,
) -> (String, Reference) {
    let parent = Parent::Embedded(empty_serial(title(journal), SerialType::AcademicJournal));
    let mut component = empty_serial_component(id, SerialComponentType::Article, Some(title(art_title)), parent);
    
    component.author = Some(author);
    component.issued = edtf(year);
    component.doi = doi.map(|d| d.to_string());
    component.pages = pages.map(|p| p.to_string());
    component.volume = volume.map(|v| NumOrStr::Str(v.to_string()));
    component.issue = issue.map(|i| NumOrStr::Str(i.to_string()));
    
    (id.to_string(), Reference::SerialComponent(Box::new(component)))
}

fn chapter(
    id: &str,
    author: Contributor,
    year: &str,
    ch_title: &str,
    coll_title: &str,
    editors: Option<Contributor>,
    pages: Option<&str>,
    publisher: Option<Contributor>,
) -> (String, Reference) {
    let mut coll = empty_collection(CollectionType::EditedBook, Some(title(coll_title)));
    coll.editor = editors;
    coll.issued = edtf(year);
    coll.publisher = publisher;
    
    let parent = Parent::Embedded(coll);
    let mut component = empty_collection_component(id, MonographComponentType::Chapter, Some(title(ch_title)), parent);
    
    component.author = Some(author);
    component.issued = edtf(year);
    component.pages = pages.map(|p| NumOrStr::Str(p.to_string()));
    
    (id.to_string(), Reference::CollectionComponent(Box::new(component)))
}

fn report(
    id: &str,
    author: Contributor,
    year: &str,
    report_title: &str,
    publisher: Option<Contributor>,
) -> (String, Reference) {
    let mut monograph = empty_monograph(id, MonographType::Report, title(report_title));
    monograph.author = Some(author);
    monograph.issued = edtf(year);
    monograph.publisher = publisher;
    
    (id.to_string(), Reference::Monograph(Box::new(monograph)))
}

// ── Humanities ─────────────────────────────────────────────────────────

/// Humanities references: translated works, classics, edited collections,
/// journal articles with subtitles, anonymous/no-author sources.
pub fn humanities_refs() -> Bibliography {
    let mut bib = Bibliography::new();

    // Translated book with original-date
    let (id, mut r) = book(
        "foucault1977",
        name("Foucault", "Michel"),
        "1977",
        "Discipline and Punish",
        Some(org("Pantheon Books")),
    );
    // Set translator and original-date on the inner Monograph
    if let Reference::Monograph(ref mut m) = r {
        m.translator = Some(name("Sheridan", "Alan"));
        m.original_date = Some(edtf("1975"));
    }
    bib.insert(id, r);

    // Classic literature — single author
    let (id, r) = book(
        "morrison1987",
        name("Morrison", "Toni"),
        "1987",
        "Beloved",
        Some(org("Alfred A. Knopf")),
    );
    bib.insert(id, r);

    // Humanities journal article — tests subtitles
    let (id, r) = article(
        "said1978",
        name("Said", "Edward W."),
        "1978",
        "The Problem of Textuality",
        "Critical Inquiry",
        Some("4"),
        Some("4"),
        Some("673-714"),
        Some("10.1086/447961"),
    );
    bib.insert(id, r);

    // Edited collection
    let (id, r) = chapter(
        "butler1993",
        name("Butler", "Judith"),
        "1993",
        "Critically Queer",
        "Bodies That Matter",
        Some(name("Butler", "Judith")),
        Some("223-242"),
        Some(org("Routledge")),
    );
    bib.insert(id, r);

    // No-author / anonymous primary source
    let (id, r) = book(
        "beowulf2000",
        name("Heaney", "Seamus"),
        "2000",
        "Beowulf: A New Verse Translation",
        Some(org("W. W. Norton")),
    );
    bib.insert(id, r);

    bib
}

// ── Social Sciences ────────────────────────────────────────────────────

/// Social science references: co-authored books, institutional authors,
/// APA-style articles, **disambiguation pair** (same author, same year).
pub fn social_science_refs() -> Bibliography {
    let mut bib = Bibliography::new();

    // Co-authored book (2 authors — tests "&" vs "and" conjunction)
    let (id, r) = book(
        "berger1966",
        names(&[("Berger", "Peter L."), ("Luckmann", "Thomas")]),
        "1966",
        "The Social Construction of Reality",
        Some(org("Anchor Books")),
    );
    bib.insert(id, r);

    // APA-style 3-author article — tests shortening threshold
    let (id, r) = article(
        "smith2019",
        names(&[("Smith", "John A."), ("Garcia", "Maria"), ("Lee", "Wei")]),
        "2019",
        "Effects of Climate Policy on Economic Growth",
        "Annual Review of Economics",
        Some("11"),
        None,
        Some("451-477"),
        Some("10.1146/annurev-economics-080218-030244"),
    );
    bib.insert(id, r);

    // Institutional / corporate author (report)
    let (id, r) = report(
        "who2023",
        org("World Health Organization"),
        "2023",
        "World Health Statistics 2023",
        Some(org("World Health Organization")),
    );
    bib.insert(id, r);

    // Disambiguation pair A — same author, same year
    let (id, r) = article(
        "johnson2020a",
        name("Johnson", "Mark"),
        "2020",
        "Social Media and Political Polarization",
        "Journal of Communication",
        Some("70"),
        Some("3"),
        Some("340-365"),
        None,
    );
    bib.insert(id, r);

    // Disambiguation pair B — same author, same year
    let (id, r) = article(
        "johnson2020b",
        name("Johnson", "Mark"),
        "2020",
        "Online Discourse in the Age of Misinformation",
        "Political Communication",
        Some("37"),
        Some("2"),
        Some("215-237"),
        None,
    );
    bib.insert(id, r);

    bib
}

// ── Sciences ───────────────────────────────────────────────────────────

/// Science references: single-author article, multi-author article,
/// massive author list (et al.), conference proceedings, preprint.
pub fn science_refs() -> Bibliography {
    let mut bib = Bibliography::new();

    // Single-author journal article with DOI
    let (id, r) = article(
        "einstein1905",
        name("Einstein", "Albert"),
        "1905",
        "On the Electrodynamics of Moving Bodies",
        "Annalen der Physik",
        Some("322"),
        Some("10"),
        Some("891-921"),
        Some("10.1002/andp.19053221004"),
    );
    bib.insert(id, r);

    // 3-author article — tests "Author, Author, & Author" patterns
    let (id, r) = article(
        "watson1953",
        names(&[("Watson", "James D."), ("Crick", "Francis H. C.")]),
        "1953",
        "Molecular Structure of Nucleic Acids",
        "Nature",
        Some("171"),
        Some("4356"),
        Some("737-738"),
        Some("10.1038/171737a0"),
    );
    bib.insert(id, r);

    // Massive author list (7 authors — triggers et al.)
    let (id, r) = article(
        "lander2001",
        names(&[
            ("Lander", "Eric S."),
            ("Linton", "Lauren M."),
            ("Birren", "Bruce"),
            ("Nusbaum", "Chad"),
            ("Zody", "Michael C."),
            ("Baldwin", "Jennifer"),
            ("Devon", "Keri"),
        ]),
        "2001",
        "Initial Sequencing and Analysis of the Human Genome",
        "Nature",
        Some("409"),
        Some("6822"),
        Some("860-921"),
        Some("10.1038/35057062"),
    );
    bib.insert(id, r);

    // Conference proceedings — 4 authors
    let (id, r) = chapter(
        "vaswani2017",
        names(&[
            ("Vaswani", "Ashish"),
            ("Shazeer", "Noam"),
            ("Parmar", "Niki"),
            ("Uszkoreit", "Jakob"),
        ]),
        "2017",
        "Attention Is All You Need",
        "Advances in Neural Information Processing Systems 30",
        Some(names(&[("Guyon", "I."), ("von Luxburg", "U."), ("Bengio", "S.")])),
        Some("5998-6008"),
        Some(org("Curran Associates")),
    );
    bib.insert(id, r);

    // Single-author book
    let (id, r) = book(
        "kuhn1962",
        name("Kuhn", "Thomas S."),
        "1962",
        "The Structure of Scientific Revolutions",
        Some(org("University of Chicago Press")),
    );
    bib.insert(id, r);

    bib
}

// ── Public API ─────────────────────────────────────────────────────────

/// Returns a cross-field default set (mix of ~6 references).
pub fn default_refs() -> Bibliography {
    let mut bib = Bibliography::new();

    // Humanities pick
    let (id, r) = book(
        "morrison1987",
        name("Morrison", "Toni"),
        "1987",
        "Beloved",
        Some(org("Alfred A. Knopf")),
    );
    bib.insert(id, r);

    // Social science pick — co-authored
    let (id, r) = book(
        "berger1966",
        names(&[("Berger", "Peter L."), ("Luckmann", "Thomas")]),
        "1966",
        "The Social Construction of Reality",
        Some(org("Anchor Books")),
    );
    bib.insert(id, r);

    // Science — single author article
    let (id, r) = article(
        "einstein1905",
        name("Einstein", "Albert"),
        "1905",
        "On the Electrodynamics of Moving Bodies",
        "Annalen der Physik",
        Some("322"),
        Some("10"),
        Some("891-921"),
        Some("10.1002/andp.19053221004"),
    );
    bib.insert(id, r);

    // Science — massive author list (et al.)
    let (id, r) = article(
        "lander2001",
        names(&[
            ("Lander", "Eric S."),
            ("Linton", "Lauren M."),
            ("Birren", "Bruce"),
            ("Nusbaum", "Chad"),
            ("Zody", "Michael C."),
            ("Baldwin", "Jennifer"),
            ("Devon", "Keri"),
        ]),
        "2001",
        "Initial Sequencing and Analysis of the Human Genome",
        "Nature",
        Some("409"),
        Some("6822"),
        Some("860-921"),
        Some("10.1038/35057062"),
    );
    bib.insert(id, r);

    // Social science — disambiguation pair
    let (id, r) = article(
        "johnson2020a",
        name("Johnson", "Mark"),
        "2020",
        "Social Media and Political Polarization",
        "Journal of Communication",
        Some("70"),
        Some("3"),
        Some("340-365"),
        None,
    );
    bib.insert(id, r);
    let (id, r) = article(
        "johnson2020b",
        name("Johnson", "Mark"),
        "2020",
        "Online Discourse in the Age of Misinformation",
        "Political Communication",
        Some("37"),
        Some("2"),
        Some("215-237"),
        None,
    );
    bib.insert(id, r);

    bib
}

/// Returns the appropriate bibliography for the given field.
pub fn refs_for_field(field: Option<&str>) -> Bibliography {
    match field {
        Some("humanities") => humanities_refs(),
        Some("social_science") => social_science_refs(),
        Some("sciences") => science_refs(),
        _ => default_refs(),
    }
}
