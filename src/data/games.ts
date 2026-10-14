/**
 * 명국 모음. 수순은 해설 문서에 실린 기보를 그대로 가져왔고 단위 테스트에서 합법성과 결말을 확인합니다.
 */
export interface ModelGame {
  id: string;
  /** 한국어 제목 */
  title: string;
  white: string;
  black: string;
  site: string;
  year: string;
  result: "1-0" | "0-1" | "1/2-1/2";
  /** 관련 해설 문서 */
  doc: string;
  /** 한 줄 소개 */
  summary: string;
  pgn: string;
}

export const MODEL_GAMES: ModelGame[] = [
  {
    id: "opera-game",
    title: "오페라 게임",
    white: "Paul Morphy",
    black: "브런즈윅 공작·이주아르 백작",
    site: "파리",
    year: "1858",
    result: "1-0",
    doc: "philidor-defense",
    summary:
      "오페라 극장 관람석에서 둔 대국. 빠른 전개, 열린 선을 이용한 기물 희생, 마지막 퀸 희생과 룩 메이트까지 '전개의 교과서'로 불립니다.",
    pgn: "1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#",
  },
  {
    id: "immortal-game",
    title: "불멸의 게임",
    white: "Adolf Anderssen",
    black: "Lionel Kieseritzky",
    site: "런던",
    year: "1851",
    result: "1-0",
    doc: "kings-gambit",
    summary:
      "앤더슨이 비숍, 두 룩, 퀸까지 내주고 남은 소수 기물로 메이트한 낭만주의 체스의 상징적인 대국입니다.",
    pgn: "1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#",
  },
  {
    id: "evergreen-game",
    title: "에버그린 게임",
    white: "Adolf Anderssen",
    black: "Jean Dufresne",
    site: "베를린",
    year: "1852",
    result: "1-0",
    doc: "italian-game-evans-gambit",
    summary:
      "에반스 갬빗에서 나온 대국으로, 연속된 희생 끝에 비숍 두 개로 메이트하는 결말이 유명합니다.",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7#",
  },
  {
    id: "game-of-the-century",
    title: "세기의 대국",
    white: "Donald Byrne",
    black: "Bobby Fischer",
    site: "뉴욕 (로젠월드 기념 대회)",
    year: "1956",
    result: "0-1",
    doc: "grunfeld-defense",
    summary:
      "13세의 피셔가 17...Be6!!로 퀸을 내주고 '풍차' 디스커버드 체크로 물질을 쓸어 담아 메이트로 끝낸 대국입니다.",
    pgn: "1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2#",
  },
  {
    id: "kasparov-topalov-1999",
    title: "카스파로프의 불멸의 게임",
    white: "Garry Kasparov",
    black: "Veselin Topalov",
    site: "베이크안제이",
    year: "1999",
    result: "1-0",
    doc: "pirc-defense",
    summary:
      "피르츠 디펜스의 Be3 체계에서 24. Rxd4!! 룩 희생 이후 흑 킹이 보드를 가로질러 쫓겨 다닌 대국입니다.",
    pgn: "1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7",
  },
  {
    id: "anand-topalov-2010",
    title: "아난드 – 토팔로프, 세계 챔피언십 4국",
    white: "Viswanathan Anand",
    black: "Veselin Topalov",
    site: "소피아 (세계 챔피언십)",
    year: "2010",
    result: "1-0",
    doc: "catalan-opening",
    summary:
      "오픈 카탈란에서 백이 중앙을 돌파하고 23. Nxh6+ 희생으로 공격을 완성한 대국입니다.",
    pgn: "1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. g3 dxc4 5. Bg2 Bb4+ 6. Bd2 a5 7. Qc2 Bxd2+ 8. Qxd2 c6 9. a4 b5 10. Na3 Bd7 11. Ne5 Nd5 12. e4 Nb4 13. O-O O-O 14. Rfd1 Be8 15. d5 Qd6 16. Ng4 Qc5 17. Ne3 N8a6 18. dxc6 bxa4 19. Naxc4 Bxc6 20. Rac1 h6 21. Nd6 Qa7 22. Ng4 Rad8 23. Nxh6+ gxh6 24. Qxh6 f6 25. e5 Bxg2 26. exf6 Rxd6 27. Rxd6 Be4 28. Rxe6 Nd3 29. Rc2 Qh7 30. f7+ Qxf7 31. Rxe4 Qf5 32. Re7",
  },
  {
    id: "fischer-myagmarsuren-1967",
    title: "피셔 – 먀그마르수렌",
    white: "Bobby Fischer",
    black: "Lhamsuren Myagmarsuren",
    site: "수스 인터존",
    year: "1967",
    result: "1-0",
    doc: "kings-indian-attack",
    summary:
      "킹스 인디언 어택의 교과서. e5로 중앙을 묶고 킹사이드로 기물을 모아 h열을 여는 전형적인 공격입니다.",
    pgn: "1. e4 e6 2. d3 d5 3. Nd2 Nf6 4. g3 c5 5. Bg2 Nc6 6. Ngf3 Be7 7. O-O O-O 8. e5 Nd7 9. Re1 b5 10. Nf1 b4 11. h4 a5 12. Bf4 a4 13. a3 bxa3 14. bxa3 Na5 15. Ne3 Ba6 16. Bh3 d4 17. Nf1 Nb6 18. Ng5 Nd5 19. Bd2 Bxg5 20. Bxg5 Qd7 21. Qh5 Rfc8 22. Nd2 Nc3 23. Bf6 Qe8 24. Ne4 g6 25. Qg5 Nxe4 26. Rxe4 c4 27. h5 cxd3 28. Rh4 Ra7 29. Bg2 dxc2 30. Qh6 Qf8 31. Qxh7+",
  },
  {
    id: "fischer-sherwin-1957",
    title: "피셔 – 셔윈",
    white: "Bobby Fischer",
    black: "James Sherwin",
    site: "뉴저지 오픈",
    year: "1957",
    result: "1-0",
    doc: "kings-indian-attack",
    summary:
      "시실리안 수순으로 들어간 킹스 인디언 어택. 18. Nxh7 희생과 h폰 전진으로 흑 킹을 무너뜨렸습니다.",
    pgn: "1. e4 c5 2. Nf3 e6 3. d3 Nc6 4. g3 Nf6 5. Bg2 Be7 6. O-O O-O 7. Nbd2 Rb8 8. Re1 d6 9. c3 b6 10. d4 Qc7 11. e5 Nd5 12. exd6 Bxd6 13. Ne4 c4 14. Nxd6 Qxd6 15. Ng5 Nce7 16. Qc2 Ng6 17. h4 Nf6 18. Nxh7 Nxh7 19. h5 Nh4 20. Bf4 Qd8 21. gxh4 Rb7 22. h6 Qxh4 23. hxg7 Kxg7 24. Re4 Qh5 25. Re3 f5 26. Rh3 Qe8 27. Be5+ Nf6 28. Qd2 Kf7 29. Qg5 Qe7 30. Bxf6 Qxf6 31. Rh7+ Ke8 32. Qxf6 Rxh7 33. Bc6+",
  },
];
