import { useState } from 'react';
import type { ProjectDossier } from '../../types/investor-dossier';

interface DocumentCenterViewerProps {
  dossier: ProjectDossier;
}

export function DocumentCenterViewer({ dossier }: DocumentCenterViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { slides, downloadPdfPath, meta, documents, pdfFilename } = dossier;
  const hasSlides = slides && slides.length > 0;
  const currentSlide = hasSlides
    ? (slides[currentSlideIndex] ?? slides[0]!)
    : null;

  const handleNext = () => {
    if (!slides || slides.length === 0) return;
    setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (!slides || slides.length === 0) return;
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const resolvedFilename = pdfFilename ?? 'Investment_Prospectus.pdf';

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-8">
      {/* 1. HEADER & DOWNLOAD ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
              Investor Due Diligence & Document Center
            </span>
          </div>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Official Investment Prospectus & Technical Documentation
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
            Complete audited business plan, single-line circuit diagrams (SLD),
            grid interconnection approvals, and offtake agreements for{' '}
            {meta.projectName}.
          </p>
        </div>

        {/* Primary Download CTA Button */}
        <div className="shrink-0">
          <a
            href={downloadPdfPath}
            download={resolvedFilename}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-[#183d89] hover:bg-[#132f6b] !text-white px-5 py-3.5 text-xs font-bold transition shadow-sm cursor-pointer group"
          >
            <svg
              className="h-4 w-4 !text-emerald-400 group-hover:translate-y-0.5 transition"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="!text-white font-bold">
              Download Official Prospectus (PDF)
            </span>
          </a>
        </div>
      </div>

      {/* 2. INTERACTIVE SLIDE VIEWER (IF SLIDES AVAILABLE) */}
      {hasSlides && currentSlide && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-t-blue bg-t-blue/10 px-3 py-1 rounded-lg">
                Slide {currentSlide.pageNumber} of {slides.length}
              </span>
              <h4 className="font-bold text-xs sm:text-sm text-zinc-900 truncate max-w-md">
                {currentSlide.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-xl border border-black/10 bg-white hover:bg-zinc-100 p-2 text-zinc-700 transition cursor-pointer"
                title="Previous Slide"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl border border-black/10 bg-white hover:bg-zinc-100 p-2 text-zinc-700 transition cursor-pointer"
                title="Next Slide"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="rounded-xl border border-black/10 bg-white hover:bg-zinc-100 p-2 text-zinc-700 transition cursor-pointer hidden sm:block"
                title="Expand Fullscreen"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Slide Stage */}
          <div className="relative aspect-16/10 sm:aspect-16/11 w-full overflow-hidden rounded-3xl border border-black/10 bg-zinc-950 shadow-sm flex items-center justify-center">
            <img
              src={currentSlide.imagePath}
              alt={currentSlide.title}
              className="w-full h-full object-contain select-none cursor-pointer"
              onClick={handleNext}
            />
            <div className="absolute bottom-3 right-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-mono text-white/90">
              Click anywhere on slide to advance
            </div>
          </div>

          {/* Slide Thumbnail Strip */}
          <div className="overflow-x-auto pb-2 pt-1 flex gap-2">
            {slides.map((s, idx) => {
              const isSelected = idx === currentSlideIndex;
              return (
                <button
                  key={s.pageNumber}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`flex-shrink-0 w-28 sm:w-32 rounded-xl overflow-hidden border-2 text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-t-blue ring-2 ring-t-blue/30 shadow-xs'
                      : 'border-black/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-16/11 bg-zinc-100 overflow-hidden">
                    <img
                      src={s.imagePath}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-1.5 bg-white text-[10px] font-medium text-zinc-700 truncate">
                    {s.pageNumber}. {s.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VERIFIED DOCUMENT REPOSITORY LIST */}
      {documents && documents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-zinc-950">
              Verified Legal, Engineering & Interconnection Files
            </h4>
            <span className="font-mono text-[11px] text-zinc-500">
              {documents.length} Files Ready for Due Diligence
            </span>
          </div>

          <div className="divide-y divide-black/5 rounded-2xl border border-black/10 bg-zinc-50/50 overflow-hidden">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-zinc-50/80 transition"
              >
                <div className="flex items-start gap-3">
                  <span className="h-8 w-8 rounded-xl bg-t-blue/10 text-t-blue flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </span>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-zinc-950">
                      {doc.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 font-mono">
                      <span>{doc.category}</span>
                      <span>·</span>
                      <span>{doc.fileFormat}</span>
                      <span>·</span>
                      <span>{doc.fileSize}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="font-mono text-xs uppercase font-semibold text-emerald-700">
                    {doc.status}
                  </span>
                  <a
                    href={doc.downloadPath ?? downloadPdfPath}
                    download={resolvedFilename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-800 transition"
                  >
                    <span>View / Download</span>
                    <svg
                      className="h-3.5 w-3.5 text-zinc-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CONTACTS & PROJECT TEAM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-black/10">
        <div className="rounded-2xl border border-black/10 bg-zinc-50/70 p-5 space-y-2">
          <span className="text-[11px] font-mono font-bold text-t-blue uppercase tracking-wider">
            Technology Provider & Manufacturing
          </span>
          <div className="font-bold text-sm text-zinc-950">
            {meta.technologyProvider}
          </div>
          <div className="text-xs text-zinc-600 space-y-0.5">
            <div>Engineering Headquarters: European Union</div>
            <div>
              Official Portal:{' '}
              <a
                href="https://www.wattino.eu"
                target="_blank"
                rel="noreferrer"
                className="text-t-blue hover:underline"
              >
                www.wattino.eu
              </a>
            </div>
            <div>Inquiries: info@wattino.eu</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-zinc-50/70 p-5 space-y-2">
          <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
            Host Partner & Site Directorate
          </span>
          <div className="font-bold text-sm text-zinc-950">
            {meta.partnerCompany}
          </div>
          <div className="text-xs text-zinc-600 space-y-0.5">
            <div>Deployment Location: {meta.location}</div>
            <div>Verification: Cerbo GX Cryptographic Telemetry Oracle</div>
            <div>Protocol Custody: {meta.investorPerTz}</div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal View */}
      {isFullscreen && hasSlides && currentSlide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4 sm:p-8 animate-fade-in"
        >
          <div className="flex items-center justify-between text-white pb-4 border-b border-white/10">
            <div className="font-mono text-sm">
              Slide {currentSlide.pageNumber} of {slides.length}:{' '}
              {currentSlide.title}
            </div>
            <div className="flex items-center gap-3">
              <a
                href={downloadPdfPath}
                download={resolvedFilename}
                className="text-xs font-semibold bg-white text-zinc-950 px-3 py-1.5 rounded-lg hover:bg-zinc-200"
              >
                Download PDF
              </a>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:text-zinc-300 font-bold text-sm p-1.5 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-2">
            <img
              src={currentSlide.imagePath}
              alt={currentSlide.title}
              className="max-h-[85vh] max-w-[95vw] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
