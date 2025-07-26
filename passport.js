// import dotenv from 'dotenv';
// dotenv.config();

// import express from 'express';
// import fs from 'fs';
// import bodyParser from 'body-parser';
// import compression from 'compression';
// import helmet from 'helmet';
// import session from 'express-session';
// import FileStore from 'session-file-store';

// // Prisma와 bcrypt 추가
// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';

// const app = express();
// const prisma = new PrismaClient();
// const fileStore = FileStore(session);

// app.use(helmet());
// app.use(express.static('public'));
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json()); // JSON 파싱 추가
// app.use(compression());
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'asadlfkj!@#!@#dfgasdg',
//   resave: false,
//   saveUninitialized: true,
//   store: new fileStore()
// }));

// import passport from 'passport';
// import { Strategy as LocalStrategy } from 'passport-local';

// // Passport 직렬화/역직렬화
// passport.serializeUser(function(user, done) {
//   console.log('serializeUser', user.id);
//   done(null, user.id);
// });

// passport.deserializeUser(async function(id, done) {
//   try {
//     console.log('deserializeUser', id);
//     const user = await prisma.user.findUnique({
//       where: { id: id },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         photo: true,
//         createdAt: true
//       }
//     });
    
//     if (!user) {
//       return done(new Error('사용자를 찾을 수 없습니다'), null);
//     }
    
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

// passport.use(new LocalStrategy(
//     {
//       usernameField: 'email',
//       passwordField: 'pwd'
//     },
//     async function (username, password, done) {
//       console.log('LocalStrategy', username, password);
      
//       try {
//         // 사용자 조회
//         const user = await prisma.user.findUnique({
//           where: { email: username },
//           include: {
//             socialLogins: true
//           }
//         });

//         if (!user) {
//           console.log('사용자를 찾을 수 없음:', username);
//           return done(null, false, {
//             message: 'Incorrect username.'
//           });
//         }

//         // 소셜 로그인 전용 계정 확인
//         if (!user.password && user.socialLogins.length > 0) {
//           console.log('소셜 로그인 전용 계정:', username);
//           return done(null, false, {
//             message: '소셜 로그인으로 가입된 계정입니다.'
//           });
//         }

//         // 비밀번호 검증
//         const isValidPassword = await bcrypt.compare(password, user.password);
//         if (!isValidPassword) {
//           console.log('비밀번호 불일치:', username);
//           return done(null, false, {
//             message: 'Incorrect password.'
//           });
//         }

//         // 마지막 로그인 시간 업데이트
//         await prisma.user.update({
//           where: { id: user.id },
//           data: { lastLoginAt: new Date() }
//         });

//         console.log('로그인 성공:', username);
        
//         // 비밀번호 제거 후 반환
//         const { password: _, ...userWithoutPassword } = user;
//         return done(null, userWithoutPassword);

//       } catch (error) {
//         console.error('LocalStrategy 에러:', error);
//         return done(error);
//       }
//     }
// ));

// // Passport 초기화
// app.use(passport.initialize());
// app.use(passport.session());

// app.post('/auth/login/password', //'/auth/login/password'로 인증정보를 보냈을때
//     passport.authenticate('local', { //'local' 페이스북이나 구글이 아닌 로컬 전략
//     successRedirect: '/', //성공했을때 홈으로 보냄
//     failureRedirect: '/auth/login' //실패했을때 다시 로그인으로 보내기
//   }));

// app.get('*', function(request, response, next){
//   fs.readdir('./data', function(error, filelist){
//     request.list = filelist;
//     next();
//   });
// });

// // 라우터 import (ES6 방식)
// import indexRouter from './routes/index.js';
// import topicRouter from './routes/topic.js';
// import authRouter from './routes/auth.js';

// app.use('/', indexRouter);
// app.use('/topic', topicRouter);
// app.use('/auth', authRouter);

// app.use(function(req, res, next) {
//   res.status(404).send('Sorry cant find that!');
// });

// app.use(function (err, req, res, next) {
//   console.error(err.stack);
//   res.status(500).send('Something broke!');
// });

// // 서버 실행
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, function() {
//   console.log(`🚀 Passport 서버 실행 중: http://localhost:${PORT}`);
// });

// export default app;
