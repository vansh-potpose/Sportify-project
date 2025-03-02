
let currentSong = new Audio();
let songs=[];
const playSVG=`<svg xmlns="http://www.w3.org/2000/svg" class="playbar-button" role="img" aria-hidden="true" viewBox="0 0 16 16" ><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"></path></svg>`
const pauseSVG=`<svg xmlns="http://www.w3.org/2000/svg"  class="playbar-button pause" viewBox="0 0 24 24" width="40" height="40" color="#ffffff" fill="none">
<path d="M4 7C4 5.58579 4 4.87868 4.43934 4.43934C4.87868 4 5.58579 4 7 4C8.41421 4 9.12132 4 9.56066 4.43934C10 4.87868 10 5.58579 10 7V17C10 18.4142 10 19.1213 9.56066 19.5607C9.12132 20 8.41421 20 7 20C5.58579 20 4.87868 20 4.43934 19.5607C4 19.1213 4 18.4142 4 17V7Z" stroke="currentColor" stroke-width="1.5" />
<path d="M14 7C14 5.58579 14 4.87868 14.4393 4.43934C14.8787 4 15.5858 4 17 4C18.4142 4 19.1213 4 19.5607 4.43934C20 4.87868 20 5.58579 20 7V17C20 18.4142 20 19.1213 19.5607 19.5607C19.1213 20 18.4142 20 17 20C15.5858 20 14.8787 20 14.4393 19.5607C14 19.1213 14 18.4142 14 17V7Z" stroke="currentColor" stroke-width="1.5" />
</svg>`

function formatTime(seconds) {
    if(isNaN(seconds)|| seconds<0){
        return "00:00"
    }
    seconds=Math.floor(seconds)
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const paddedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

    return `${minutes}:${paddedSeconds}`;
}

class Music {
    constructor(svg, name, description, link) {
        this.svg = svg;
        this.name = name;
        this.description = description;
        this.link = link;
    }

    async checkImageExists(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    getMusicElement() {
        const librarySong = document.createElement('div');
        librarySong.setAttribute("class","library-song")
        let className;
        if(this.svg=="/spotify assests/music.svg"){
            className="just-icon";
        }else{
            className="just-img"
        }
        librarySong.innerHTML = `
                <div class="library-song-left">
                    <img src="${this.svg}" class="${className}" alt="music icon">
                    <div class="musicInfo">
                        <p class="music-name" data-filename=${this.link}>${this.name}</p>
                        <p class="music-des">${this.description}</p>
                    </div>
                </div>
                <button>
                    <svg xmlns="http://www.w3.org/2000/svg" class="play-btn-library" viewBox="0 0 24 24" width="40" height="40" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                        <path d="M9.5 11.1998V12.8002C9.5 14.3195 9.5 15.0791 9.95576 15.3862C10.4115 15.6932 11.0348 15.3535 12.2815 14.6741L13.7497 13.8738C15.2499 13.0562 16 12.6474 16 12C16 11.3526 15.2499 10.9438 13.7497 10.1262L12.2815 9.32594C11.0348 8.6465 10.4115 8.30678 9.95576 8.61382C9.5 8.92086 9.5 9.6805 9.5 11.1998Z" fill="currentColor" />
                    </svg>
                </button>`;
        return librarySong;
    }
}

async function checkImageExists(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}


async function fetchAudioFileAndExtractImage(audioUrl) {
    try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            jsmediatags.read(blob, {
                onSuccess: function(tag) {
                    const picture = tag.tags.picture;
                    if (picture) {
                        const base64String = picture.data.reduce((data, byte) => {
                            return data + String.fromCharCode(byte);
                        }, '');
                        const base64 = `data:${picture.format};base64,${window.btoa(base64String)}`;
                        resolve(base64);
                    } else {
                        console.log('No album art found');
                        resolve(null);
                    }
                },
                onError: function(error) {
                    console.error('Error reading metadata:', error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Error fetching audio file:', error);
        return null;
    }
}

async function getSongs(folder){
    document.querySelector(".current-library").innerHTML=folder.split('/')[1].replace("%20"," ");
    let a = await fetch(`http://192.168.1.8:3000/${folder}/`)
    let respose = await a.text();
    let div = document.createElement("div")
    div.innerHTML=respose
    let as = div.getElementsByTagName("a")
    songs=[]
    for (let i = 0; i < as.length; i++) {
        const element = as[i];
        if(element.href.endsWith(".mp3")){
            const fileName = decodeURIComponent(element.href.split('/').pop());
            const audioUrl = `http://192.168.1.8:3000/${folder}/${fileName}`;

            const embeddedImage = await fetchAudioFileAndExtractImage(audioUrl);
            let svg = embeddedImage;

            if (!svg) {
                svg = "/spotify assests/music.svg";
            }
            const [name, descriptionWithExt] = fileName.split('-');
            songs.push(new Music(svg, name, descriptionWithExt.replace('.mp3', ''), element.href));
        }
    } 
    
    let library_playlist = document.querySelector(".library-playlist");
    library_playlist.innerHTML=""

    for (const song of songs) {
        library_playlist.appendChild(song.getMusicElement());   
    }
    
    Array.from(document.querySelector(".library-playlist").getElementsByClassName("library-song")).forEach(e=>{
        e.addEventListener("click",element=>{
            playMusic(e.getElementsByClassName("music-name")[0].dataset.filename)
        })
    })
    
}

const playMusic = (track)=>{
    if(currentSong.src!=track){
        currentSong.src=track;
        currentSong.play()
        play.innerHTML=pauseSVG
        document.querySelector(".songinfo").innerHTML=decodeURIComponent(track.split('/').pop()).replace('.mp3', '').replace('-',' - ');
        document.querySelector(".songtime").innerHTML="00:00 / 00:00"
    }else{
        
        if(currentSong.paused){
            currentSong.play()
            play.innerHTML=pauseSVG

        }else{
            currentSong.pause()
            play.innerHTML=playSVG
        }
    }
}

async function displayAlbums(){
    let a = await fetch(`http://192.168.1.8:3000/songs/`)
    let respose = await a.text();
    let div = document.createElement("div")
    div.innerHTML=respose
    let as = div.getElementsByTagName("a")
    let card_container=document.querySelector(".playlist")
    let anchors =Array.from(as)
    for (let i = 0; i < anchors.length; i++) {
        const e = anchors[i];
        if(e.href.includes("/songs/") && !e.href.includes(".htaccess")){
            let folder=e.href.split("/").slice(-2)[0];
            let a = await fetch(`http://192.168.1.8:3000/songs/${folder}/info.json`)
            let respose = await a.json();
            let div =document.createElement("div")
            div.setAttribute("class","song-card")
            div.setAttribute("data-folder",`${folder}`)
            
            //cover shuold be a jpg file
            div.innerHTML=`<button class="play"><img src="spotify assests/library.svg" alt=""></button>
                            <img src="http://192.168.1.8:3000/songs/${folder}/cover.jpg" alt="art1">
                            <p class="song-name">${respose.title}</p>
                            <p class="song-dis">${respose.description}</p>`
            card_container.appendChild(div)
            
        }
    }
    
    Array.from(document.getElementsByClassName("song-card")).forEach(e => { 
        e.addEventListener("click", async item => {
            await getSongs(`songs/${item.currentTarget.dataset.folder}`)  
            playMusic(songs[0].link)
          
        })
    })
}

async function main(){
    let folder
    let a = await fetch(`http://192.168.1.8:3000/songs/`)
    let respose = await a.text();
    let div = document.createElement("div")
    div.innerHTML=respose
    let as = div.getElementsByTagName("a")
    let anchors =Array.from(as)
    for (let i = 0; i < anchors.length; i++) {
        const e = anchors[i];
        if(e.href.includes("/songs/") && !e.href.includes(".htaccess")){
            folder=e.href.split("/").slice(-2)[0];
            break;
        }
    }
    await getSongs(`songs/${folder}`)

    displayAlbums()

    currentSong.src=songs[0].link
    document.querySelector(".songinfo").innerHTML=decodeURIComponent(songs[0].link.split('/').pop()).replace('.mp3', '').replace('-',' - ');
    document.querySelector(".songtime").innerHTML="00:00 / 00:00"

    
    play.addEventListener("click",()=>{
        if(currentSong.paused){
            
            currentSong.play()
            play.innerHTML=pauseSVG

        }else{
            currentSong.pause()
            play.innerHTML=playSVG
        }
    }
    )
    currentSong.addEventListener("timeupdate",() => {
      document.querySelector(".songtime").innerHTML=`${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`
      let per=(currentSong.currentTime/currentSong.duration)*100
      document.querySelector(".circle").style.left=per+"%"
      document.querySelector(".completionbar").style.width=per+0.1+"%"

      if(per==100){
        let index=songs.findIndex(song => song.link === currentSong.src)
        playMusic(songs[(index+1)%songs.length].link)
      }
    })

    document.querySelector(".seekbar").addEventListener("click",e => {
        let per=(e.offsetX/e.currentTarget.getBoundingClientRect().width)*100
      document.querySelector(".circle").style.left=per+"%"
      document.querySelector(".completionbar").style.width=per+0.1+"%"
      currentSong.currentTime=((currentSong.duration)*per)/100
    }
    )

    document.querySelector(".hamburger").addEventListener("click",() => {
        document.querySelector(".left").style.left=0+"%"
    }
    )
    document.querySelector(".close").addEventListener("click",() => {
        document.querySelector(".left").style.left=-110+"%"
    }
    )
    previous.addEventListener("click",() => { 
        let index=songs.findIndex(song => song.link === currentSong.src)
        if(index-1>=0){
            playMusic(songs[index-1].link)
        }else{
            playMusic(songs[songs.length+index-1].link)
        }
     })
    next.addEventListener("click",() => { 
        let index=songs.findIndex(song => song.link === currentSong.src)
        playMusic(songs[(index+1)%songs.length].link)
     })
     
     const volumeIcon = document.querySelector('.volume');
     const volrange = document.querySelector('.volrange');
 
     let timer;
 
     volumeIcon.addEventListener('click', function() {
         clearTimeout(timer);
         volrange.style.display = 'block';
         volrange.style.opacity = '1';
     });
 
     volumeIcon.addEventListener('mouseleave', function() {
         timer = setTimeout(() => {
             volrange.style.opacity = '0';
             setTimeout(() => {
                 volrange.style.display = 'none';
             }, 500);
         }, 2000);
     });
 
     volrange.addEventListener('mouseenter', function() {
         clearTimeout(timer);
         volrange.style.display = 'block';
         volrange.style.opacity = '1';
     });
 
     volrange.addEventListener('mouseleave', function() {
         timer = setTimeout(() => {
             volrange.style.opacity = '0';
             setTimeout(() => {
                 volrange.style.display = 'none';
             }, 500);
         }, 2000);
     });

     document.querySelector(".volrange").addEventListener("change",(e)=>{
        currentSong.volume=parseInt(e.target.value)/100;
     })

     volumeIcon.addEventListener('dblclick', () => {
        if(volrange.value>0){
            temp = volrange.value
            currentSong.volume = 0;
            volrange.value = 0;
            document.querySelector('.volume img').src="spotify assests/mute.svg"
        }else{
            currentSong.volume = parseInt(temp)/100;
            volrange.value = temp;
            document.querySelector('.volume img').src="spotify assests/volume.svg"
        }
    });
    

   
}
main()