fist [![Build Status](https://travis-ci.org/fistlabs/fist.png?branch=rc-dev)](https://travis-ci.org/fistlabs/fist)
=========

Fist - это nodejs-фреймворк для написания серверных приложений. Fist предлагает архитектуру, поддержка которой одинаково проста как для простых так и для сложных web-серверов.
```js

var Fist = require('fist/Framework');
var fist = new Fist();

fist.decl('startTime', new Date());

fist.decl('index', ['startTime'], function (track, errors, result) {
    var uptime = new Date() - result.startTime;
    track.send(200, '<div>Server uptime: ' + uptime + 'ms</div>');
});

fist.route('GET', '/', 'index');

fist.listen(1337);
```
* [Базовые понятия](#%D0%91%D0%B0%D0%B7%D0%BE%D0%B2%D1%8B%D0%B5-%D0%BF%D0%BE%D0%BD%D1%8F%D1%82%D0%B8%D1%8F)
  * [Приложение](#%D0%9F%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5)
  * [Плагин](#%D0%9F%D0%BB%D0%B0%D0%B3%D0%B8%D0%BD)
  * [Узел](#%D0%A3%D0%B7%D0%B5%D0%BB)
  * [Трэк](#%D0%A2%D1%80%D1%8D%D0%BA)
  * [Роутер](#%D0%A0%D0%BE%D1%83%D1%82%D0%B5%D1%80)
* [Расширение](#%D0%A0%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5)
  * [Плагинизация]()
  * [Наследование]()
* [Ссылки](#%D0%A1%D1%81%D1%8B%D0%BB%D0%BA%D0%B8)
  * [Плагины]()
  * [Узлы]()

#Базовые понятия
##Приложение
Приложением называется экземпляр класса [Framework](Framework.js).
Класс [Framework](Framework.js) наследует от EventEmitter, таким образом приложение во время своей работы может сообщать среде о каких либо действиях.
###События
####```sys:ready()```
Приложение проинициализировано и готово отвечать на запросы
####```sys:error(*)```
Критическая ошибка инициализации приложения, оно никогда не подожжет событие ```sys:ready```, то есть никогда не начнет отвечать на запросы. В обработчике есть смысл только прологгировать фатальное исключение и завершить процесс с соответствующим кодом выхода
####```sys:request(Track)```
В приложение поступил запрос
####```sys:response(Track)```
Приложение выполнило ответ
####```sys:match(Track)```
[Роутер](#%D0%A0%D0%BE%D1%83%D1%82%D0%B5%D1%80) нашел подходящий под url маршрут
####```sys:ematch(Track)```
[Роутер](#%D0%A0%D0%BE%D1%83%D1%82%D0%B5%D1%80) не смог найти подходящего маршрута
####```sys:accept(Object)```
[Узел](#%D0%A3%D0%B7%D0%B5%D0%BB) разрешен без ошибки
####```sys:reject(Object)```
[Узел](#%D0%A3%D0%B7%D0%B5%D0%BB) разрешен с ошибкой
###API
####```new Framework([params])```
Создает экземпляр приложения.
```js
var Framework = require('fist/Framework');
var app = new Framework();
```
В конструктор можно передать объект параметров, который будет склонирован в объект [app.params](#appparams)
####```app.params```
Объект параметров приложения, переданных при инстанцировании. Может использоваться в [плагинах](#%D0%9F%D0%BB%D0%B0%D0%B3%D0%B8%D0%BD) и [узлах](#%D0%A3%D0%B7%D0%B5%D0%BB).
####```app.decl(name[, deps][, body])```
Метод, декларирует [узел](#%D0%A3%D0%B7%D0%B5%D0%BB) и его зависимости.

```name``` - есть уникальное имя декларации, если продекларировать еще один [узел](#%D0%A3%D0%B7%D0%B5%D0%BB) с такми же ```name```, то последняя декларация "затрет" предыдущую. 

```deps``` - завсисимости [узла](#%D0%A3%D0%B7%D0%B5%D0%BB). Это может быть как массив строк, имен [узлов](##%D0%A3%D0%B7%D0%B5%D0%BB), так и просто строка, если у [узла](#%D0%A3%D0%B7%D0%B5%D0%BB) только одна зависимость. Необязательный аргумент.

```body``` - тело [узла](#%D0%A3%D0%B7%D0%B5%D0%BB), может быть любого типа, а поэтому необязательный аргумент. 
```js
app.decl('answer', 42);
```
####```app.route(verb, expr, name[, data[, opts]])```
Декларирует маршрут во встроенном [роутере](#%D0%A0%D0%BE%D1%83%D1%82%D0%B5%D1%80) приложения, связывая его с [узлом](#%D0%A3%D0%B7%D0%B5%D0%BB).

```verb``` - метод запроса для ```expr```

```expr``` - шаблон урла запроса в терминах [роутера](#%D0%A0%D0%BE%D1%83%D1%82%D0%B5%D1%80)

```name``` - уникальный идентификатор маршрута. Каждый маршрут должен иметь уникальный идентификатор.

```data``` - статические данные, связанные с маршрутом. Имеет смысл с маршрутом связывать имя [узла](#%D0%A3%D0%B7%D0%B5%D0%BB), который будет разрешен при матчинге урла на ```expr```. По-умолчанию ```data``` === ```name```. Если нужно связать с маршрутом [узел](#%D0%A3%D0%B7%D0%B5%D0%BB) имя которого отличное от ```name``` маршрута, то можно указать это в ```data```.
```js
app.route('GET', '/', 'index', 'customUnit');
//  или так
app.route('POST', '/upload/', 'upload', {
    unit: 'myUploader',
    customData: 42
});

```
```opts``` - опции компилирования ```expr``` в регулярное выражение.

```opts.noend``` - не добавлять якорь конца строки

```opts.nostart``` - не добавлять якорь начала строки

```opts.nocase``` - добавить флаг ignoreCase
```js
app.route('GET', '/static/', 'static-files', 'static', {
    noend: true,
    nocase: true
});
```
####```app.plug([plugin[, plugin...]])```
Добавляет в приложение плагин, который будет выполнен при инициализации.
```js
app.plug(function (done) {
    this.myFeature = 42;
    done();
});
```
####```app.ready()```
Запускает инициализацию приложения. Во время инициализации выполняются все плагины и по ее завершении зажигается событие [```sys:ready```](#sysready), если хотя бы один из плагинов разрешился с ошибкой, то sys:ready никогда не будет зажжено, но будет зажжено [```sys:error```](#syserror)
####```app.listen()```
Запускает сервер приложения и автоматом вызывает [app.ready](#appready)
##Плагин
Плагинами для приложения называются задачи, которые следует выполнить до того как приложение начнет отвечать на запросы. Плагин представляет собой функцию, в которую передается резолвер. Плагин должен вызвать резолвер чтобы объявить о завершении своей работы.
```js
//  подключаю плагин для инициализации шаблонов
app.plug(function (done) {
    var self = this;
    Fs.readDir('views', function (list) {
        list.forEach(function (item) {
            this.renderers[item] = require('./views/' + item);
        }, self);
        done(null, null);
    });
});
```
Плагины начинают отрабатывать при инициализации. Чтобы запустить инициализацию, необходимо вызвать [```app.ready()```](#appready)
##Узел
Узлом называется минимальная самостоятельная функциональная часть приложения. Технически это связка имя + зависимости + тело.
Если у приложения потребовали разрешить узел, то сначала разрешаются зависимости узла, а затем сам узел. Узел может быть разрешен как с результатом так и с ошибкой. Узел декларируется методом [```app.decl```](#appdecl)
Тело узла может быть как функционального типа, так и любого другого.
Если узел имеет функциональное тело, то тело должно разрешить узел одним из нескольких способов по завершении работы узла.
Классический способ разрешить тело узла это вызвать функцию-резолвер ```done```
```js
app.decl('awesome', function (track, errors, result, done) {
    asker('http://example.com/asom-api', done);
});
```
Если ```done``` был вызван с двумя аргументами, то второй аргумент будет считаться результатом разрешения узла. Если ```done``` будет вызыван менее чем с двумя аргументами, то первый аргумент будет считаться ошибкой разрешения узла. Но в любом случае узел будет считаться разрешенным.

Функцию ```done``` вызывать не обязательно, вы можете разрешать узел другими способами. Например если вы вернете из узла любое значение, отличное от ```undefined``` до того как вызовете ```done```, то вызов ```done``` ожидаться не будет. ```Fist``` будет разрешать именно возвращенное значение.
```js
app.decl('version', function () {

    return require('./package.json').version;
});
```
В примере выше возвращается примитив, примитив не может разрешить узел с ошибкой, значит узел будет разрешен без ошибки с возвращенным результатом.

Возвращенные значения могут разрешаться по-разному, в зависимости от их типа. Классический пример - ```promise```. Тут все ясно, ```promise``` может перейти или в состояние ```fulfilled``` или в ```rejected```. Так что если вы вернете ```promise```, то тот по факту своего разрешения разрешит и узел в соответствующее состояние.

Узлы поддерживают и другие возвращаемые значения, подразумевающие асинхронное выполнение. Из узла вы можете вернуть ```thunk``` - такой паттерн из FP, функцию которая вызовет резолвер когда закончит свое выполнение.
```js
app.decl('how2live', function () {

    return function (done) {
        setTimeout(function () {
            done(null, 42);
        }, 100);
    };
});
```
Также из узла вы можете вернуть ```ReadableStream```, тогда результатом разрешения узла будет буффер данных, который будет выкачан из потока, или ошибка, которая может произойти во время чтения.
```js
app.decl('package', function () {
    
    return fs.createReadStream('package.json');
});
```
Из узла вы можете вернуть даже генератор/итератор!
```js
app.decl('gen', function () {

    return {
        _done: false,
        _remains: 5,
        next: function () {
            
            if ( this._done ) {
                throw new TypeError();
            }
        
            if ( 0 === this._remains ) {
                throw new TypeError();
            }
            
            this._remains -= 1;
            
            if ( 0 === this._remains ) {
                this._done = true;
            }
            
            return {
                done: this._done,
                value: Math.random()
            };
        },
        
        throw: function (err) {
            this._done = true;
            throw err;
        }
        
    };
});
```
Такой узел будет разрешен когда генератор закончит генерацию. Будьте бдительны если захотите возвратить бесконечный генератор.

Но и это еще не все! Из узла можно вернуть ```GeneratorFuntion```! ```GeneratorFuncion``` вызовется с аргументом, функцией резолвером, и узел будет разрешен тогда, когда получившийся генератор вызовет ```done``` или завершит генерацию. Если генератор вызовет ```done```, то узел будет разрешен, но генератор все равно будет продолжать работу до конца.
```js
app.decl(function () {
    
    return function * (done) {
    
        var i = 0;
    
        while (i < 5) {
            yield i += 1;
        }
        
        done(null, 42);
        
        yield 100500;
        
        console.log('yeahh!');
        
        return 9000;
    };
});
```
Пример выглядит странным, и это так, зачем писать такой код? Это потому что вы не знаете какие значения можете генерировать и как ```fist``` управляет генератором. Но об этом чуть ниже.

Само тело узла может быть всех типов которые были перечислены выше как возвращаемые значения. Единственное отличие в том что не-функциональные тела узлов будут разрешены единожды и сразу и узел будет разрешен статически, результат будет всегда один и тот же.

```js
app.decl('remoteConfig', vowAsker('http://example.com/config'));
```
Функциональное же тело будет вызваться при каждой операции разрешения узла.

Думаю, самое интересное - это когда телом узла является ```GeneratorFunction```.
```js
app.decl('generate', function * (track, errors, result, done) {
    
    var user = yield getUser(track.cookie('sessid'));
    
    return yield {
        status: getStatus(user.id),
        deals: getUserDeals(user.id)
    };
});
```
Что тут происходит? В узле ```generate``` мы сначала получаем асинхронно статус пользователя. Генерируемые значения могут быть всех типов что и возвращаемые, но плюс два бонуса. Можно сгенерировать массив или объект ключ->значение. Каждое значение в массиве или объекте будет разрешено и результирующий объект будет содержать уже разрешенные значения.
#####Зависимости узлов
Вы могли заметить что в функциональное тело узлов передаются два интересных объекта: ```errors``` и ```result```. Что это такое? Как мы уже говорили, главная гордость фреймворка - зависимые друг от друга но самостоятельные части приложения, узлы, юниты. Если узел зависит от других узлов то в объектах ```errors``` и ```result``` будут находиться результаты разрешения зависимостей. Если зависимость была разрешена с ошибкой то ее можно посмотреть в ```errors```, если без, то в ```result```.
```js
app.decl('err', function (track, errors, result, done) {
    done('ERR');
});

app.decl('res', function (track, errors, result, done) {
    done(null, 'RES');
});

app.decl('assert', ['err', 'res'], function (track, errors, result, done) {
    assert(errors.err === 'ERR');
    assert(result.res === 'RES');
    done(null, 'OK');
});
```
Тут все просто и почти никакой магии. Есть одна особенность имен узлов. Имена узлов могут интерпретироваться как ```namespace```
```js
app.decl('meta.data', 42);
app.decl('assert', ['meta.data'], function (track, errors, result, done) {
    assert(result.meta.data === 42);
    done(null, 'OK');
});
```
Если по какой-то причине вы не хотите чтобы точки интерпретировались как особые символы в именах узлов, то вы можете их экранировать
```js
app.decl('meta\\.data', 42);
app.decl('assert', ['meta\\.data'], function (track, errors, result, done) {
    assert(result['meta.data'] === 42);
    done(null, 'OK');
});
```
##Трэк
Итак, ```track```. Это специальный объект который передается в функциональное тело каждого [узла](#%D0%A3%D0%B7%D0%B5%D0%BB), участвующего в операции разрешения. Этот объект нужен для обработки запроса и управления операцией разрешения узла. Другим словом с помощью ```track``` можно читать из ```request```, писать в ```response```  и вызывать другие узлы.
###API
####```track.agent```
Ссылка на приложение, может использоваться для триггера кастомных событий.
####```track.url```
Разобранный ```url``` запроса.
####```track.match```
Результат матчинга роутера, объект с ключами, именами параметров с их значениями.
####```track.arg(name[, only])```
Возвращает значение аргумента запроса. По умолчанию смотрит есть ли значние в [```track.match```](#trackmatch), а если там его нет то смотрит в [```track.url```](#trackurl).query. Если передать вторым аргументом ```true```, то будет искать значение только в [```track.match```](#trackmatch).
####```track.header([name[, value[, soft]]])```
Полиморфный метод, с помощью которого можно читать заголовки из ```request``` и ставить заголовоки в ```response```.
Если вызвать метод без аргументов, то он вернет все заголовки запроса объектом. Если передать один аргумент, то будет возвращено значение одного заголовка с переданным именем. Если передать два аргумента, то метод установит заголовок в ```response```. Для установки заголовков есть еще третий аргумент, который устанавливает soft-режим установки заголовка. Если он будет позитивным, то заголовок установится только если он еще не был установлен. Иначе заголовок будет затирать собой уже установленный. Можно передать первым и единственным аргументом объект, тогда будут установлены все заголовки, имена которых будут соответствовать ключам, а значения - значениям переданных объектов по их ключам. Также можно передать вторым аргуметом ```soft```, который будет применен ко всем устанавливаемым заголовкам.
####```track.cookie([name[, value[, opts]]])```
Метод похож по своей полиморфности на [```track.header```](#trackheader) лишь за тем исключением, что нет soft-режима и нельзя ставить куки пачкой. Если вызвать метод без аргументов, то будут возвращены все куки запроса, а именно, разобранный заголовок запроса ```Cookie```. Если вызвать метод с одним аргументом, то будет возвращено значение конкретной куки запрсоа. Если вызвать метод с двумя и более оргументами, то будет установлены куки в ```response```. По факту жто шортхэнд для установки заголовка ```Set-Cookie```. Первым аргументом передаем имя устанавливаемой куки, вторым значение, третьим можно передать опции куки.

```opts.expires``` - полиморфный параметр. Если его тип - ```Number```, то он будет работать как ```max-age```, только в миллисекундах, иначе переданное значение будет приведено к ```Date```, и эта дата будет являться датой истекания срока жизни куки.

```opts.path``` - документ на который надо ставит куку

```opts.secure``` - если значение позитивное, то будет добавлена опция ```secure```

```opts.domain``` - домен на который будет поставлена кука

##Роутер
#Расширение
#Ссылки
