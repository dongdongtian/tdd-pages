const {src,dest,parallel,watch,series}=require("gulp") //gulp自带api

const del = require("del") //删除

const browserSync = require("browser-sync") //热更新
const bs = browserSync.create()

const loadPlugins= require("gulp-load-plugins") //自动加载插件直接使用plugins.方法 用gulp-if babel等
const plugins =loadPlugins()

// const sass = require("gulp-sass")(require("node-sass"))
// const plugins.babel = require("gulp-babel")
// const plugins.swig = require("gulp-swig")
// const imagemin = require("gulp-imagemin")

const cwd=process.cwd()
let config = {
    build:{
        src:'src',
        dist:"dist",
        temp:'temp',
        public: 'public',
        paths: {
          styles: 'assets/styles/*.scss',
          scripts: 'assets/scripts/*.js',
          pages: '*.html',
          images: 'assets/images/**',
          fonts: 'assets/fonts/**'
        }
    }
}
try{
   const loadConfig = require(`${cwd}/pages.config.js`)
   config = Object.assign({},config,loadConfig)
}catch(e){

}
const clean = ()=>{ //清楚文件夹里的文件
    return del([config.build.dist, config.build.temp])
}

const style= ()=>{  // 转换css
    return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.sass({outputStyle:"expanded"}))
    .pipe(dest(config.build.temp)) //转到临时文件
    .pipe(bs.reload({stream:true}))
}
const script = ()=>{ //转换 js
    return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({presets:[require("@babel/preset-env")]}))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({stream:true}))

}
const page = ()=>{ //转换页面模版
    return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({data:config.data}))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({stream:true}))

}
const image = ()=>{ //压缩图片
    return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
    .pipe(bs.reload({stream:true}))

}
const font = ()=>{//转换字体
    return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))

}
const extra= ()=>{ //其他文件
    return src('**',{ base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

const serve = ()=>{
    watch(config.build.paths.styles, { cwd: config.build.src },style) //热更新样式
    watch(config.build.paths.scripts, { cwd: config.build.src },script)//热更新js
    watch(config.build.paths.pages, { cwd: config.build.src },page)//热更新页面模版
    watch(
    //     [

    //     'src/assets/images/**',  //图片以及其他不需要热更新的不用更新 会在开发过程中很慢
    //     'public/**',
    //     'src/assets/fonts/**',
    // ],
    [
        config.build.paths.images,
        config.build.paths.fonts
      ], { cwd: config.build.src },bs.reload) //不需要实时的 用reload方法 变化之后就用这个
      watch('**', { cwd: config.build.public }, bs.reload)
    bs.init({
         notify:false,
        port:2000,
       // files:'dist/**', //不使用这个files 使用reload 把文件以流的方式推到浏览器
        server:{
            baseDir:[config.build.temp, config.build.dist, config.build.public],
            // ['temp','src','pubic'], //css js 请求dist  图片的 请求src和public中的
            routes:{
                '/node_modules':'node_modules'
            }
        }
    })
}
// const useref =()=>{ //要先执行compile 再执行useref 
//     return src("temp/*.html",{base:"dist"})
//     .pipe(plugins.useref({searchPath:['dist','.']})) // .为跟目录
//     .pipe(plugins.if(/\.js$/,plugins.uglify())) // 压缩js
//     .pipe(plugins.if(/\.css$/,plugins.cleanCss()))// 压缩css
//      .pipe(plugins.if(/\.js$/,plugins.htmlmin({
//         collapseWhitespace:true,// 压缩html 去除空白字符
//         minifyCSS:true, //行内css压缩
//         minifyJS:true, //行内js压缩
//     })))
//     .pipe(dest('dist'))
// }
const useref = () => {
    return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
      .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
      // html js css
      .pipe(plugins.if(/\.js$/, plugins.uglify()))
      .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
      .pipe(plugins.if(/\.html$/, plugins.htmlmin({
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true
      })))
      .pipe(dest(config.build.dist))
  }


// const compile = parallel(style,script,page,image)
// const build = parallel(compile,extra)
//  图片 文件监视 只更新一次 热更新去掉

const compile = parallel(style,script,page) //更新一次 需要启动一次 开发时候用到
const build =series(
    clean,
    parallel(
        series(compile,useref),
        extra,
        image,
        font
        ))  //至最后一次打包的时候需要 其他开发的时候不需要转换或者压缩 上线前用到的
const devlop = parallel(compile,serve)

module.exports={
    clean,
    build,
    devlop,
    

}






