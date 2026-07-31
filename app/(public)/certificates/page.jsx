export default function CertificatesPage() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Quality Assurance</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
            Our Certifications
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            We are committed to the highest standards of quality management and environmental responsibility.
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { id: 1, title: 'ISO 9001:2015', desc: 'Quality Management Systems', file: '#' },
            { id: 2, title: 'AS9100D', desc: 'Aviation, Space, and Defense Quality', file: '#' },
            { id: 3, title: 'ISO 14001:2015', desc: 'Environmental Management Systems', file: '#' },
          ].map((cert) => (
            <div key={cert.id} className="pt-6">
              <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 border border-gray-200 text-center">
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{cert.title}</h3>
                <p className="mt-5 text-base text-gray-500">{cert.desc}</p>
                <div className="mt-6">
                  <a href={cert.file} className="text-base font-medium text-blue-600 hover:text-blue-500">
                    Download PDF &rarr;
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
