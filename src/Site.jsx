import React, { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Home,
  Building2,
  PaintRoller,
  Plus,
  Minus,
  CircleHelp,
} from "lucide-react";
import { services } from "./data.js";
import { money } from "./pricing.js";
import { useTariffs } from "./Pricing.jsx";

function Brand({ light = false }) {
  return (
    <a
      className={`brand ${light ? "brand-light" : ""}`}
      href="/"
      aria-label="Порядок — главная"
    >
      <span className="brand-symbol" aria-hidden="true">
        ◒
      </span>
      <span>
        порядок<span className="brand-dot">.</span>
      </span>
    </a>
  );
}
export function Header() {
  return (
    <header className="site-header portfolio-header">
      <div className="container nav">
        <Brand />
        <span className="header-caption">
          Клининг с заботой
          <br />о вашем времени
        </span>
        <nav aria-label="Основная навигация">
          <a href="/#services">Услуги</a>
          <a href="/#how">Как это работает</a>
        </nav>
        <a href="/order" className="button button-small">
          Рассчитать уборку <ArrowUpRight size={17} />
        </a>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="portfolio-footer">
      <div className="container footer-main">
        <div>
          <Brand light />
          <p>Больше времени на своё.</p>
          <span className="footer-city">
            Вымышленный бренд · Санкт-Петербург
          </span>
        </div>
        <div>
          <span className="eyebrow">ПОПРОБУЙТЕ ВЕСЬ ПРОЦЕСС</span>
          <a href="/order">
            01 / Рассчитать и оформить <ArrowUpRight size={16} />
          </a>
          <a href="/admin">
            02 / Открыть заявку в CRM <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          Порядок © {new Date().getFullYear()} · демонстрационный проект
        </span>
        <span>Без реальных заказов. Все тарифы — примеры.</span>
      </div>
    </footer>
  );
}
export function Landing() {
  const [faq, setFaq] = useState(null);
  const { tariffs } = useTariffs();
  const questions = [
    [
      "Из чего складывается стоимость?",
      "Площадь умножается на демо-тариф выбранной уборки. Если сумма меньше минимальной стоимости, применяется минимум. Дополнительные услуги считаются по количеству или площади. Расчёт примерный, окончательная цена согласовывается отдельно.",
    ],
    [
      "Можно попробовать заказ для офиса?",
      "Да. Выберите уборку офиса, площадь, количество помещений и периодичность. Можно указать удобное время, добавить фотографии и пожелания.",
    ],
    [
      "Что происходит с заявкой?",
      "Она сохраняется в этом браузере и появляется в CRM. После оформления откройте карточку, проверьте данные и поменяйте статус. На другом устройстве или в другом браузере будет своя демо-база.",
    ],
    [
      "Это сайт настоящей компании?",
      "Нет. «Порядок» — вымышленный бренд для демонстрации сайта клининга и CRM. Заказы никуда не отправляются. Тарифы можно настроить в CRM, чтобы проверить собственный сценарий расчёта.",
    ],
  ];
  return (
    <>
      <Header />
      <main>
        <section className="editorial-hero container">
          <div className="hero-kicker">
            <span>
              <i className="live-dot" /> ПРОСТРАНСТВО ДЛЯ ЖИЗНИ
            </span>
            <span>САНКТ-ПЕТЕРБУРГ / ДЕМО</span>
          </div>
          <div className="editorial-intro">
            <h1>
              Время — ваше.
              <br />
              <em>Порядок — наш.</em>
            </h1>
            <div className="editorial-summary">
              <p>
                Квартира, в которую приятно вернуться.
                <br />
                Выходные, которые снова ваши.
                <br />
                Начните с пары простых шагов.
              </p>
              <a href="/order" className="text-link">
                Выбрать уборку <ArrowUpRight size={20} />
              </a>
            </div>
          </div>
          <div className="editorial-photo">
            <img
              src="/hero.webp"
              alt="Светлая гостиная с мягким диваном, деревом и зелёными растениями"
              fetchPriority="high"
            />
            <div className="photo-overlay" />
            <span className="photo-index">01 — ДОМ, В КОТОРОМ ХОРОШО</span>
            <div className="photo-caption">
              <span>
                Меньше дел.
                <br />
                <em>Больше жизни.</em>
              </span>
              <a
                href="/order"
                className="photo-round"
                aria-label="Перейти к расчёту уборки"
              >
                <ArrowUpRight size={32} />
              </a>
            </div>
            <span className="photo-stamp">
              порядок
              <br />
              начинается
              <br />
              <em>здесь <ArrowUpRight aria-hidden="true" focusable="false" style={{width:'1em',height:'1em',display:'inline-block',verticalAlign:'-.125em'}} /></em>
            </span>
          </div>
          <div className="hero-footnotes">
            <span>
              <Home size={17} /> Квартиры и дома
            </span>
            <span>
              <Building2 size={17} /> Офисы и пространства
            </span>
            <span>
              <PaintRoller size={17} /> После ремонта
            </span>
          </div>
        </section>
        <section id="services" className="section container portfolio-services">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / ПОД ВАШ РИТМ</span>
              <h2>
                Своя уборка.
                <br />
                <em>Для каждого дня.</em>
              </h2>
            </div>
            <p>
              Выберите задачу — остальное
              <br />
              соберём в одной заявке.
              <br />
              <span className="demo-inline">Цены ниже — демо-примеры.</span>
            </p>
          </div>
          <div className="service-grid">
            {services.map((service, i) => (
              <a
                href={`/order?service=${service.id}`}
                className={`service-card service-card-${i}`}
                key={service.id}
              >
                <div className="service-top">
                  <span className="service-number">0{i + 1}</span>
                  <span className="service-symbol"><ArrowUpRight aria-hidden="true" focusable="false" style={{width:'1em',height:'1em',display:'inline-block',verticalAlign:'-.125em'}} /></span>
                </div>
                <span className="service-tag">{service.tag}</span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-bottom">
                  <span>
                    от {money(tariffs.services[service.id].minimum)}
                    <small>демо-тариф</small>
                  </span>
                  <span className="round-arrow">
                    <ArrowUpRight size={21} />
                  </span>
                </div>
              </a>
            ))}
          </div>
          <p className="services-note">
            <CircleHelp size={15} /> Предварительный расчёт появится в форме.
            Итоговая цена согласовывается отдельно.
          </p>
        </section>
        <section className="portfolio-manifesto">
          <div className="container manifesto-grid">
            <span className="eyebrow">МЕСТО ДЛЯ ГЛАВНОГО</span>
            <h2>
              Уют складывается
              <br />
              из мелочей.
              <br />
              <em>И свободного времени.</em>
            </h2>
            <div>
              <p>
                Мы собрали привычные вопросы в короткую форму: что убрать,
                сколько метров, когда удобно и на что обратить внимание.
              </p>
              <p>Ваши пожелания, фотографии и расчёт — в одной заявке.</p>
              <a href="/order" className="text-link">
                Посмотреть, как это работает <ArrowUpRight size={19} />
              </a>
            </div>
          </div>
        </section>
        <section id="how" className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">02 / ОТ ФОРМЫ ДО CRM</span>
              <h2>
                Один заказ.
                <br />
                <em>Две стороны.</em>
              </h2>
            </div>
            <p>
              Интерактивный пример для клининга.
              <br />
              Побудьте клиентом,
              <br />а потом — администратором.
            </p>
          </div>
          <div className="process-grid">
            {[
              [
                "01",
                "Выберите уборку",
                "Вид услуги, площадь и дополнения. Примерная стоимость меняется сразу.",
              ],
              [
                "02",
                "Добавьте детали",
                "Дата, время, адрес и фотографии. Всё важное для будущей уборки.",
              ],
              [
                "03",
                "Проверьте в CRM",
                "Откройте свою заявку и смените статус на «В обработке». Всё уже работает.",
              ],
            ].map(([number, title, text]) => (
              <div className="process-card" key={number}>
                <span className="process-number">{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="demo-route">
            <a href="/order" className="button">
              Начать с заявки <ArrowUpRight size={19} />
            </a>
            <a href="/admin" className="text-link">
              Сразу в CRM <ArrowRight size={17} />
            </a>
            <span>Данные сохраняются только в этом браузере.</span>
          </div>
        </section>
        <section className="faq-section section container">
          <div>
            <span className="eyebrow">03 / БЕЗ ЛИШНИХ ВОПРОСОВ</span>
            <h2>
              Всё <em>понятно.</em>
            </h2>
          </div>
          <div className="faq-list">
            {questions.map(([question, answer], i) => (
              <div
                className={`faq-item ${faq === i ? "expanded" : ""}`}
                key={question}
              >
                <button
                  aria-expanded={faq === i}
                  onClick={() => setFaq(faq === i ? null : i)}
                >
                  {question}
                  {faq === i ? <Minus size={18} /> : <Plus size={18} />}
                </button>
                {faq === i && <p>{answer}</p>}
              </div>
            ))}
          </div>
        </section>
        <section className="container final-cta-wrap">
          <div className="final-cta">
            <div>
              <span className="eyebrow">НАЧНИТЕ С ПАРЫ МИНУТ</span>
              <h2>
                Пусть дома
                <br />
                будет <em>легко.</em>
              </h2>
              <p>
                Рассчитайте примерную стоимость и попробуйте оформить заявку.
              </p>
            </div>
            <a href="/order" className="button button-cream">
              Рассчитать уборку <ArrowUpRight size={20} />
            </a>
            <span className="cta-sparkle" aria-hidden="true">
              ◒
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
