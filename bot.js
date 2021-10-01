var puppeteer = require('puppeteer');
require('dotenv/config');
const nodemailer = require('nodemailer');
const SMTP_CONFIG = require('./smtp');

gerar_senha = () => {
  let resultado = [];
  let maiusculeAletory;
  let minusculeAleatory;
  let chars;
  let maiusculeChars;
  let minusculeChars;
  let charsAleatory;
  let aleatorio;
  for (let i = 0; i < 8; i++) {
    maiusculeChars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    minusculeChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    chars = ['@', '!', '#', '$', '%', '&', '*', '-'];
    maiusculeAletory = maiusculeChars[Math.floor(Math.random() * maiusculeChars.length)];
    minusculeAleatory = minusculeChars[Math.floor(Math.random() * minusculeChars.length)];
    charsAleatory = chars[Math.floor(Math.random() * chars.length)];
    aleatorio = Math.random() * 9;
    resultado[i] = Math.floor(aleatorio);
  }
  return resultado.concat(maiusculeAletory).concat(minusculeAleatory).concat(charsAleatory).join('');
}
let aleatoryPassword = gerar_senha();

const transporter = nodemailer.createTransport({
  host: SMTP_CONFIG.host,
  port: SMTP_CONFIG.port,
  secure: false,
  auth:{
      user: SMTP_CONFIG.user,
      pass: SMTP_CONFIG.pass,
  },
  tls:{
      rejectUnauthorized: false,
  }
});


async function sendEmail(){
  const mailSent = transporter.sendMail({
      text: `ALERTA: A senha do wifi está sendo alterada para ${aleatoryPassword}. Em 5 minutos essa será a nova senha da rede.`,
      subject: 'Alteração da senha do Wifi',
      //Quem enviará o email  
      from: '',
      //Quem receberá o email
      to: ['']
  });

  console.log(mailSent);
}

//Envia uma email com QR CODE da nova senha
sendEmail();

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  //Acessa a página do roteador
  await page.goto('http://192.168.0.1/');

  //Faz login
  await page.click('[type="password"]');

  //Preenche com password
  await page.type('[type="password"]', process.env.PASSWORD);

  //Clica no botão de login  
  await page.click('[id="pc-login-btn"]');

  //Espera 3 segundos antes de clicar na aba de Wireless
  await page.waitForTimeout(3000);

  //Clica na aba de Wireless
  await page.click('#menuTree > li:nth-child(3)');

  await page.waitForTimeout(3000);

  //Apaga a senha atual e coloca a nova senha gerada aleatóriamente
  await page.evaluate(() => document.getElementById("wpa2PersonalPwd_2g").value = "")

  //Espera 3 segundos e então digita a nova senha gerada aleatóriamente
  await page.waitForTimeout(3000);
  await page.type('[id="wpa2PersonalPwd_2g"]', aleatoryPassword)
 
  //Depois de 5 minutos salva as configurações com a nova senha
  await page.waitForTimeout(300000)

  //Salva a nova senha
  await page.click('#save');

  //Depois de trocar espera 3 segundos e finaliza o navegador

  await page.waitForTimeout(3000)

  await browser.close();
  console.log('SENHA TROCADA COM SUCESSO, CHEQUE SEU EMAIL');
})();
