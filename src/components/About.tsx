const About = () => {
  return (
    <section id="about" className="section bg-card">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              Quiénes <span className="text-accent">Somos</span>
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Black Cat Tattoo Studio es más que un estudio de tatuajes. Somos una familia de artistas apasionados ubicados en el corazón del Born, Barcelona.
              </p>
              <p>
                Con más de 10 años de experiencia, hemos perfeccionado el arte del tatuaje en todos sus estilos, desde el realismo más detallado hasta el minimalismo más elegante.
              </p>
              <p>
                Nuestro compromiso es crear obras de arte únicas que cuenten tu historia, trabajando contigo desde el concepto inicial hasta el resultado final.
              </p>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="relative h-[400px] rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1606902965551-dce093cda6e7?w=800&q=80"
              alt="Interior del estudio"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
