interface FooterLinkProps {
    name: string;
    url: string;
  }
  
  interface FooterColumnProps {
    title: string;
    links: FooterLinkProps[];
  }
  
  const FooterColumn: React.FC<FooterColumnProps> = ({ title, links }) => {
    return (
      <div className="flex-1 min-w-[200px]">
        <h4 className="text-lg font-medium mb-6 color-primary">{title}</h4>
        <div className="flex flex-col gap-3">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              className="color-secondary hover:text-sky-400 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    );
  };
  
  const Footer: React.FC = () => {
    return (
      <footer className="bg-primary py-12 border-t border-adaptive relative z-2">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-between gap-8">
            <div className="flex-1 min-w-[200px]">
              <h4 className="text-lg font-medium mb-6 color-primary">
                Voxed
              </h4>
              <p className="color-secondary mb-4">
                Transforming education through intelligent AI technology.
              </p>
              <div className="flex gap-4 mt-4">
                <a
                  href="#"
                  className="color-secondary hover:text-sky-400 transition-colors"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M23 3.01006C23 3.01006 20.9821 4.20217 19.86 4.54006C19.2577 3.84757 18.4573 3.35675 17.567 3.13398C16.6767 2.91122 15.7395 2.96725 14.8821 3.29451C14.0247 3.62177 13.2884 4.20446 12.773 4.96377C12.2575 5.72309 11.9877 6.62239 12 7.54006V8.54006C10.2426 8.58562 8.50127 8.19587 6.93101 7.4055C5.36074 6.61513 4.01032 5.44869 3 4.01006C3 4.01006 -1 13.0101 8 17.0101C5.94053 18.408 3.48716 19.109 1 19.0101C10 24.0101 21 19.0101 21 7.51006C20.9991 7.23151 20.9723 6.95365 20.92 6.68006C21.9406 5.67355 23 3.01006 23 3.01006Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="color-secondary hover:text-sky-400 transition-colors"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 9H2V21H6V9Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="color-secondary hover:text-sky-400 transition-colors"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2H8C6.93913 2 5.92172 2.42143 5.17157 3.17157C4.42143 3.92172 4 4.93913 4 6V20C4 21.0609 4.42143 22.0783 5.17157 22.8284C5.92172 23.5786 6.93913 24 8 24H16C17.0609 24 18.0783 23.5786 18.8284 22.8284C19.5786 22.0783 20 21.0609 20 20V8L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 2V8H20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 13H8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 17H8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 9H9H8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>
  
            <FooterColumn
              title="Product"
              links={[
                { name: "Features", url: "#" },
                { name: "Pricing", url: "#" },
                { name: "Testimonials", url: "#" },
                { name: "FAQ", url: "#" },
              ]}
            />
  
            <FooterColumn
              title="Company"
              links={[
                { name: "About", url: "#" },
                { name: "Blog", url: "#" },
                { name: "Careers", url: "#" },
                { name: "Contact", url: "#" },
              ]}
            />
  
            <FooterColumn
              title="Legal"
              links={[
                { name: "Privacy Policy", url: "#" },
                { name: "Terms of Service", url: "#" },
                { name: "Cookie Policy", url: "#" },
                { name: "GDPR", url: "#" },
              ]}
            />
          </div>
  
          <div className="text-center color-muted mt-12 text-sm">
            &copy; 2025 Voxed. All rights reserved.
          </div>
        </div>
      </footer>
    );
};

export default Footer;