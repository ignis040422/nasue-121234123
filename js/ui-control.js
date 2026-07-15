// =====================================================
// 새 한월 웹맵 UI 및 마커 제어
//
// 광산      : 녹색
// 약초/누룩 : 청색
// 영단      : 황색
// 보물      : 적색
// =====================================================


// =====================================================
// 1. 레이어 그룹
// =====================================================

const layers = {
    mines: L.layerGroup(),
    herbs: L.layerGroup(),
    elixirs: L.layerGroup(),
    treasures: L.layerGroup(),
    jobCenters: L.layerGroup(),
    hunting: {}
};

window.layers = layers;


// =====================================================
// 2. 색상 정보
// =====================================================

const categoryColors = {
    "녹": "#2ecc71",
    "청": "#3498db",
    "황": "#f1c40f",
    "적": "#e74c3c",
    "사냥터": "#9b59b6",
    "전직소": "#ffffff"
};


// =====================================================
// 3. 검색용 데이터
// =====================================================

const searchData = [];


// =====================================================
// 4. 공용 마커 아이콘
// =====================================================

function createNumberIcon(color, text) {
    return L.divIcon({
        className: "",
        html: `
            <div style="
                width:24px;
                height:24px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:${color};
                border:2px solid #000;
                border-radius:4px;
                box-shadow:0 2px 5px rgba(0,0,0,0.6);
                color:#fff;
                font-size:11px;
                font-weight:900;
                text-shadow:1px 1px 2px #000;
                box-sizing:border-box;
            ">
                ${text}
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14]
    });
}


// =====================================================
// 5. HTML 문자 처리
// =====================================================

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================================
// 6. 좌표 복사
// =====================================================

window.copyCoords = async function(x, z, y) {
    const text = `${x} ${z} ${y}`;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement("textarea");

            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);

            textarea.focus();
            textarea.select();

            document.execCommand("copy");
            textarea.remove();
        }

        showCopyToast("좌표 복사 완료!");
    } catch (error) {
        console.error("좌표 복사 실패:", error);
        showCopyToast("복사 실패");
    }
};


function showCopyToast(message) {
    const toast = document.getElementById("copy-toast");
    const toastText = document.getElementById("toast-text");

    if (!toast) return;

    if (toastText) {
        toastText.innerText = message;
    } else {
        toast.innerText = message;
    }

    toast.style.display = "flex";

    clearTimeout(showCopyToast.timer);

    showCopyToast.timer = setTimeout(() => {
        toast.style.display = "none";
    }, 1500);
}


// =====================================================
// 7. 공용 팝업 생성
// =====================================================

function createPopupContent({
    title,
    category,
    x,
    y,
    z,
    effect,
    monster,
    note
}) {
    const effectHtml = effect
        ? `
            <div style="margin-top:7px;">
                <span style="font-weight:900; color:#d18b00;">[효과]</span>
                ${escapeHtml(effect)}
            </div>
        `
        : "";

    const monsterHtml = monster
        ? `
            <div style="margin-top:7px;">
                <span style="font-weight:900; color:#7d3c98;">[몬스터]</span>
                ${escapeHtml(monster)}
            </div>
        `
        : "";

    const noteHtml = note
        ? `
            <div style="
                margin-top:9px;
                padding:7px;
                background:#fff4e5;
                border:1px dashed #d17b00;
                border-radius:4px;
                color:#333;
                font-weight:700;
                line-height:1.5;
            ">
                <span style="color:#d00; font-weight:900;">[메모]</span><br>
                ${escapeHtml(note)}
            </div>
        `
        : "";

    return `
        <div style="
            min-width:220px;
            color:#000;
            text-align:center;
            line-height:1.4;
        ">
            <div style="
                font-size:18px;
                font-weight:900;
                border-bottom:2px solid #000;
                padding-bottom:7px;
                margin-bottom:9px;
            ">
                ${escapeHtml(title)}
            </div>

            <div style="
                font-size:11px;
                color:#777;
                font-weight:800;
                margin-bottom:7px;
            ">
                ${escapeHtml(category)}
            </div>

            <div
                onclick="copyCoords(${x}, ${y}, ${z})"
                style="
                    padding:8px 5px;
                    background:#333;
                    border-radius:4px;
                    cursor:pointer;
                "
            >
                <div style="
                    color:#ffd700;
                    font-size:15px;
                    font-weight:900;
                ">
                    ${x}, ${y}, ${z}
                </div>

                <div style="
                    color:#aaa;
                    font-size:10px;
                    margin-top:3px;
                ">
                    클릭하여 좌표 복사
                </div>
            </div>

            <div style="
                text-align:left;
                font-size:12px;
                margin-top:7px;
            ">
                ${effectHtml}
                ${monsterHtml}
                ${noteHtml}
            </div>
        </div>
    `;
}


// =====================================================
// 8. 검색 데이터 등록
// =====================================================

function addSearchEntry({
    name,
    category,
    item,
    marker,
    layer,
    checkboxId
}) {
    searchData.push({
        name,
        category,
        item,
        marker,
        layer,
        checkboxId,
        searchText: [
            name,
            category,
            item.n,
            item.x,
            item.y,
            item.z,
            item.effect,
            item.monster,
            item.note
        ]
            .filter(value => value !== undefined && value !== null)
            .join(" ")
            .toLowerCase()
    });
}


// =====================================================
// 9. 광산 마커
// =====================================================

const mineList = typeof mines !== "undefined" ? mines : [];

mineList.forEach(mine => {
    const position = mcToPx(mine.x, mine.z);

    const marker = L.marker(position, {
        icon: createNumberIcon(
            categoryColors["녹"],
            mine.n
        )
    });

    const title = `${mine.n}번 광산`;

    marker.bindPopup(
        createPopupContent({
            title,
            category: "광산",
            x: mine.x,
            y: mine.y,
            z: mine.z,
            note: mine.note
        }),
        {
            autoPan: true,
            keepInView: true,
            closeButton: false
        }
    );

    marker.addTo(layers.mines);

    addSearchEntry({
        name: title,
        category: "광산",
        item: mine,
        marker,
        layer: layers.mines,
        checkboxId: "mine-녹"
    });
});


// =====================================================
// 10. 약초 / 누룩 마커
// =====================================================

const herbList = typeof herbs !== "undefined" ? herbs : [];

herbList.forEach(herb => {
    const position = mcToPx(herb.x, herb.z);

    const marker = L.marker(position, {
        icon: createNumberIcon(
            categoryColors["청"],
            herb.n
        )
    });

    const title = herb.name || `약초/누룩 ${herb.n}`;

    marker.bindPopup(
        createPopupContent({
            title,
            category: "약초/누룩",
            x: herb.x,
            y: herb.y,
            z: herb.z,
            note: herb.note
        }),
        {
            autoPan: true,
            keepInView: true,
            closeButton: false
        }
    );

    marker.addTo(layers.herbs);

    addSearchEntry({
        name: title,
        category: "약초/누룩",
        item: herb,
        marker,
        layer: layers.herbs,
        checkboxId: "mine-청"
    });
});


// =====================================================
// 11. 영단 마커
// =====================================================

const elixirList = typeof elixirs !== "undefined" ? elixirs : [];

elixirList.forEach(elixir => {
    const position = mcToPx(elixir.x, elixir.z);

    const marker = L.marker(position, {
        icon: createNumberIcon(
            categoryColors["황"],
            elixir.n
        )
    });

    const title = elixir.name || `영단 ${elixir.n}`;

    marker.bindPopup(
        createPopupContent({
            title,
            category: "영단",
            x: elixir.x,
            y: elixir.y,
            z: elixir.z,
            effect: elixir.effect,
            note: elixir.note
        }),
        {
            autoPan: true,
            keepInView: true,
            closeButton: false
        }
    );

    marker.addTo(layers.elixirs);

    addSearchEntry({
        name: title,
        category: "영단",
        item: elixir,
        marker,
        layer: layers.elixirs,
        checkboxId: "mine-황"
    });
});


// =====================================================
// 12. 보물 마커
// =====================================================

const treasureList =
    typeof treasures !== "undefined"
        ? treasures
        : [];

treasureList.forEach(treasure => {
    const position = mcToPx(treasure.x, treasure.z);

    const marker = L.marker(position, {
        icon: createNumberIcon(
            categoryColors["적"],
            treasure.n
        )
    });

    const title = treasure.name || `보물 ${treasure.n}`;

    marker.bindPopup(
        createPopupContent({
            title,
            category: "보물",
            x: treasure.x,
            y: treasure.y,
            z: treasure.z,
            note: treasure.note
        }),
        {
            autoPan: true,
            keepInView: true,
            closeButton: false
        }
    );

    marker.addTo(layers.treasures);

    addSearchEntry({
        name: title,
        category: "보물",
        item: treasure,
        marker,
        layer: layers.treasures,
        checkboxId: "mine-적"
    });
});


// =====================================================
// 13. 전직소 마커
// =====================================================

const jobCenterList =
    typeof jobCenters !== "undefined"
        ? jobCenters
        : [];

jobCenterList.forEach(jobCenter => {
    const position = mcToPx(
        jobCenter.x,
        jobCenter.z
    );

    const marker = L.marker(position, {
        icon: createNumberIcon(
            categoryColors["전직소"],
            jobCenter.n || "J"
        )
    });

    const title =
        jobCenter.name ||
        `${jobCenter.n}번 전직소`;

    marker.bindPopup(
        createPopupContent({
            title,
            category: "전직소",
            x: jobCenter.x,
            y: jobCenter.y,
            z: jobCenter.z,
            note: jobCenter.note
        }),
        {
            autoPan: true,
            keepInView: true,
            closeButton: false
        }
    );

    marker.addTo(layers.jobCenters);

    addSearchEntry({
        name: title,
        category: "전직소",
        item: jobCenter,
        marker,
        layer: layers.jobCenters,
        checkboxId: "check-job-centers"
    });
});


// =====================================================
// 14. 사냥터 마커 및 목록
// =====================================================

const huntingList =
    typeof huntingGrounds !== "undefined"
        ? huntingGrounds
        : [];

const huntingListContainer =
    document.getElementById("hunt-accordion-content");

huntingList.forEach(area => {
    const position = mcToPx(area.x, area.z);

    const marker = L.marker(position, {
        icon: createNumberIcon(
            categoryColors["사냥터"],
            area.n
        )
    });

    const title = area.name || `사냥터 ${area.n}`;

    marker.bindPopup(
        createPopupContent({
            title,
            category: "사냥터",
            x: area.x,
            y: area.y,
            z: area.z,
            monster: area.monster,
            note: area.note
        }),
        {
            autoPan: true,
            keepInView: true,
            closeButton: false
        }
    );

    const huntingLayer = L.layerGroup([
        marker
    ]);

    layers.hunting[area.n] = huntingLayer;

    const checkboxId = `hunt-${area.n}`;

    addSearchEntry({
        name: title,
        category: "사냥터",
        item: area,
        marker,
        layer: huntingLayer,
        checkboxId
    });

    if (huntingListContainer) {
        const label = document.createElement("label");

        label.className = "control-item";

        label.innerHTML = `
            <input
                type="checkbox"
                id="${checkboxId}"
            >

            <span style="flex:1;">
                ${escapeHtml(title)}
            </span>

            <span style="
                font-size:10px;
                color:#888;
            ">
                ${escapeHtml(area.monster || "")}
            </span>
        `;

        huntingListContainer.appendChild(label);

        const checkbox =
            document.getElementById(checkboxId);

        if (checkbox) {
            checkbox.addEventListener(
                "change",
                function() {
                    if (this.checked) {
                        huntingLayer.addTo(map);
                        marker.openPopup();
                    } else {
                        map.removeLayer(huntingLayer);
                    }
                }
            );
        }
    }
});


// =====================================================
// 15. 체크박스 연결
// =====================================================

function bindCheckbox(ids, layer) {
    const idList = Array.isArray(ids)
        ? ids
        : [ids];

    idList.forEach(id => {
        const checkbox =
            document.getElementById(id);

        if (!checkbox) return;

        const updateLayer = () => {
            if (checkbox.checked) {
                if (!map.hasLayer(layer)) {
                    layer.addTo(map);
                }
            } else if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        };

        checkbox.addEventListener(
            "change",
            updateLayer
        );

        updateLayer();
    });
}


// 기존 광산 색상 체크박스 ID와
// 새 이름 형태의 체크박스 ID를 둘 다 지원
bindCheckbox(
    ["mine-녹", "check-mines"],
    layers.mines
);

bindCheckbox(
    ["mine-청", "check-herbs"],
    layers.herbs
);

bindCheckbox(
    ["mine-황", "check-elixirs"],
    layers.elixirs
);

bindCheckbox(
    ["mine-적", "check-treasures"],
    layers.treasures
);

bindCheckbox(
    ["check-job-centers"],
    layers.jobCenters
);


// =====================================================
// 16. 사냥터 초기화 버튼
// =====================================================

const resetHuntButton =
    document.getElementById("reset-hunt");

if (resetHuntButton) {
    resetHuntButton.addEventListener(
        "click",
        function() {
            huntingList.forEach(area => {
                const checkbox =
                    document.getElementById(
                        `hunt-${area.n}`
                    );

                if (checkbox) {
                    checkbox.checked = false;
                }

                const layer =
                    layers.hunting[area.n];

                if (layer && map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            });

            map.closePopup();
        }
    );
}


// =====================================================
// 17. 약초 초기화 버튼
// =====================================================

const resetHerbButton =
    document.getElementById("reset-herb");

if (resetHerbButton) {
    resetHerbButton.addEventListener(
        "click",
        function() {
            const checkbox =
                document.getElementById("mine-청") ||
                document.getElementById("check-herbs");

            if (checkbox) {
                checkbox.checked = false;
            }

            if (map.hasLayer(layers.herbs)) {
                map.removeLayer(layers.herbs);
            }

            map.closePopup();
        }
    );
}


// =====================================================
// 18. 검색 시스템
// =====================================================

const searchInput =
    document.getElementById("search-input");

const searchResults =
    document.getElementById("search-results");


function showSearchResults(query) {
    if (!searchResults) return;

    searchResults.innerHTML = "";

    if (!query) {
        searchResults.style.display = "none";
        return;
    }

    const filtered = searchData
        .filter(entry =>
            entry.searchText.includes(query)
        )
        .slice(0, 30);

    if (filtered.length === 0) {
        searchResults.innerHTML = `
            <div class="search-result-item">
                검색 결과가 없습니다.
            </div>
        `;

        searchResults.style.display = "block";
        return;
    }

    filtered.forEach(entry => {
        const resultItem =
            document.createElement("div");

        resultItem.className =
            "search-result-item";

        resultItem.innerHTML = `
            <span style="
                color:#777;
                font-size:11px;
                font-weight:900;
            ">
                [${escapeHtml(entry.category)}]
            </span>

            ${escapeHtml(entry.name)}

            <div style="
                margin-top:3px;
                color:#999;
                font-size:10px;
            ">
                ${entry.item.x},
                ${entry.item.y},
                ${entry.item.z}
            </div>
        `;

        resultItem.addEventListener(
            "click",
            () => {
                openSearchResult(entry);
            }
        );

        searchResults.appendChild(resultItem);
    });

    searchResults.style.display = "block";
}


function openSearchResult(entry) {
    if (
        entry.layer &&
        !map.hasLayer(entry.layer)
    ) {
        entry.layer.addTo(map);
    }

    if (entry.checkboxId) {
        const checkbox =
            document.getElementById(
                entry.checkboxId
            );

        if (checkbox) {
            checkbox.checked = true;
        }
    }

    const markerPosition =
        entry.marker.getLatLng();

    const currentZoom =
        map.getZoom();

    const targetZoom =
        Math.max(currentZoom, 0);

    map.setView(
        markerPosition,
        targetZoom,
        {
            animate: false
        }
    );

    entry.marker.openPopup();

    if (searchInput) {
        searchInput.value = entry.name;
    }

    if (searchResults) {
        searchResults.style.display = "none";
    }
}


if (searchInput && searchResults) {
    searchInput.addEventListener(
        "input",
        function() {
            const query =
                this.value
                    .trim()
                    .toLowerCase();

            showSearchResults(query);
        }
    );

    searchInput.addEventListener(
        "keydown",
        function(event) {
            if (event.key === "Escape") {
                searchResults.style.display =
                    "none";
            }
        }
    );
}


// =====================================================
// 19. 지도 클릭 시 검색 결과 닫기
// =====================================================

map.on("click", function() {
    if (searchResults) {
        searchResults.style.display = "none";
    }
});


// =====================================================
// 20. 로딩 완료 확인
// =====================================================

console.log("새 한월 웹맵 마커 로딩 완료", {
    mines: mineList.length,
    herbs: herbList.length,
    elixirs: elixirList.length,
    treasures: treasureList.length,
    huntingGrounds: huntingList.length,
    jobCenters: jobCenterList.length
});