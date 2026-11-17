// Служба «будильник»: её запускает система в момент окончания таймера, даже если экран погашен и приложение закрыто.
//  - вибрирует;
//  - для часового таймера сама ставит следующий будильник через час (в тесте — через 10 секунд),
//    чтобы вибрация повторялась на каждом обнулении, пока вы не нажмёте паузу или другой таймер;
//  - при автостарте очереди в параметре есть четвёртое число n — сколько границ ещё впереди: цепочка заканчивается, когда n = 0;
//  - если приложение с тех пор поставило новые будильники (номер поколения не совпал), служба молча выходит.
// Служба живёт доли секунды, поэтому ничего тяжёлого здесь нет.
import { Vibrator, VIBRATOR_SCENE_STRONG_REMINDER } from '@zos/sensor'
import { LocalStorage } from '@zos/storage'
import { set as alarmSet } from '@zos/alarm'

AppService({
  onInit(param) {
    const parts = String(param || '').split('|')   // вид|поколение|период в секундах[|сколько границ ещё впереди (автостарт)]
    const kind = parts[0]
    const gen = parts[1]
    const every = +parts[2] || 0
    const left = parts.length > 3 && parts[3] !== '' ? Math.max(0, +parts[3] || 0) : -1   // -1 — без ограничения (обычные занятия)

    let canCheck = false
    try {
      const ls = new LocalStorage()
      canCheck = true
      if (String(ls.getItem('gen', '')) !== String(gen)) return   // устаревший будильник
    } catch (e) { /* проверить нельзя — вибрируем, но цепочку не продолжаем */ }

    try {
      const v = new Vibrator()
      v.start({ mode: VIBRATOR_SCENE_STRONG_REMINDER })
    } catch (e) { /* вибрация не вышла */ }

    if (kind === 'hour' && canCheck && every > 0 && left !== 0) {
      const next = left < 0 ? String(param) : parts[0] + '|' + gen + '|' + every + '|' + (left - 1)
      try { alarmSet({ url: 'app-service/alarm', param: next, delay: every }) } catch (e) { /* без повтора */ }
    }
  },
  onDestroy() {}
})
