import { useEffect, useState } from "react";

const Statistics = () => {
  const stats = [
    { value: 10, label: "Años de Experiencia", suffix: "+" },
    { value: 5000, label: "Tatuajes Realizados", suffix: "+" },
    { value: 8, label: "Artistas Profesionales", suffix: "" },
    { value: 98, label: "Clientes Satisfechos", suffix: "%" },
  ];

  return (
    <section className="section bg-card">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
};

const StatCard = ({ value, label, suffix, delay }: { value: number; label: string; suffix: string; delay: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setTimeout(() => {
      const counter = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(counter);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl lg:text-6xl font-black text-accent mb-2">
        {count}{suffix}
      </div>
      <div className="text-sm md:text-base text-muted-foreground">
        {label}
      </div>
    </div>
  );
};

export default Statistics;
